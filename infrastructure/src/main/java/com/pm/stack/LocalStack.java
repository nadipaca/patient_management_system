package com.pm.stack;
import software.amazon.awscdk.services.ecs.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ecs.Protocol;
import software.amazon.awscdk.services.ecs.patterns.ApplicationLoadBalancedFargateService;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.msk.CfnCluster;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.route53.CfnHealthCheck;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class LocalStack extends Stack{
    private final Vpc vpc;
    private final Cluster ecsCluster;

    public LocalStack(final App scope, final String id, final StackProps props){
        super(scope, id, props);
        this.vpc = createVpc();

        DatabaseInstance authServiceDb = createDatabase("AuthServiceDB", "auth-service-db");

        DatabaseInstance patientServiceDb = createDatabase("PatientServiceDB", "patient-service-db");

        CfnHealthCheck authDbHealthCheck = createDbHealthCheck(authServiceDb, "AuthServiceDBHealthCheck");

        CfnHealthCheck patientDbHealthCheck = createDbHealthCheck(patientServiceDb, "PatientServiceDBHealthCheck");

        CfnCluster mskCluster = createMskCkuster();

        this.ecsCluster = createECSCluster();

        FargateService authService = createFargateService(
                "auth-service",
                "auth-service",
                List.of(4005),
                authServiceDb,
                Map.of("JWT_SECRET", "vShWzNMfsxaEX3rG9doL1vOvq8qeyaEP8hDx3jqNPsG"));

        authService.getNode().addDependency(authDbHealthCheck);
        authService.getNode().addDependency(authServiceDb);

        FargateService billingService = createFargateService(
                "billing-service",
                "billing-service",
                List.of(4001, 9001),
                null,
                null);

        FargateService analyticsService = createFargateService(
                "analytics-service",
                "analytics-service",
                List.of(4002),
                null,
                null);

        analyticsService.getNode().addDependency(mskCluster);

        FargateService patientService = createFargateService(
                "patient-service",
                "patient-service",
                List.of(4000),
                patientServiceDb,
                Map.of(
                        "BILLING_SERVICE_ADDRESS", "host.docker.internal",
                        "BILLING_SERVICE_GRPC_PORT", "9001"
                ));

        patientService.getNode().addDependency(patientServiceDb);
        patientService.getNode().addDependency(billingService);
        patientService.getNode().addDependency(mskCluster);

        createApiGatewayService();
    }

    private Vpc createVpc(){
        return Vpc.Builder
                .create(this, "PatientManagementVPC")
                .vpcName("PatientManagementVPC")
                .maxAzs(2)
                .build();
    }

    private DatabaseInstance createDatabase(String id, String dbName) {
        return DatabaseInstance
                .Builder
                .create(this, id)
                .engine(DatabaseInstanceEngine.postgres(
                        PostgresInstanceEngineProps.builder()
                                .version(PostgresEngineVersion.VER_17_2)
                                .build()))
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO))
                .allocatedStorage(20)
                .credentials(Credentials.fromGeneratedSecret("admin_user"))
                .databaseName(dbName)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }

    private CfnHealthCheck createDbHealthCheck(DatabaseInstance db, String id){
       return CfnHealthCheck.Builder
               .create(this, id)
               .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                       .type("TCP")
                       .port(Token.asNumber(db.getDbInstanceEndpointPort()))
                       .ipAddress(db.getDbInstanceEndpointAddress())
                       .requestInterval(30)
                       .failureThreshold(3)
                       .build())
               .build();
    }

    private CfnCluster createMskCkuster(){
        return CfnCluster.Builder.create(this,"MskCluster")
                .clusterName("kafka-cluster")
                .kafkaVersion("3.7.x")
                .numberOfBrokerNodes(2)
                .brokerNodeGroupInfo(CfnCluster.BrokerNodeGroupInfoProperty.builder()
                        .instanceType("kafka.m5.xlarge")
                        .clientSubnets(vpc.getPrivateSubnets().stream().map(ISubnet::getSubnetId).collect(Collectors.toList()))
                        .brokerAzDistribution("DEFAULT")
                        .build())
                .build();
    }

    // so we can access services using auth-service.patient-management.local
    private Cluster createECSCluster(){
        return Cluster.Builder.create(this, "PatientManagementECSCluster")
                .vpc(vpc)
                .defaultCloudMapNamespace(CloudMapNamespaceOptions.builder()
                        .name("patientmanagement.local")
                        .build())
                .build();
    }

    private FargateService createFargateService(
            String id,
            String imageName,
            List<Integer> ports,
            DatabaseInstance db,
            Map<String, String> additionalEnvVars
    ){
        FargateTaskDefinition taskDefinition = FargateTaskDefinition.Builder.create(this, id+"Task")
                .cpu(256)
                .memoryLimitMiB(512)
                .build();

        LogGroup logGroup = LogGroup.Builder.create(this, id + "LogGroup")
                .logGroupName("/ecs/" + imageName)
                .retention(RetentionDays.ONE_DAY) // optional
                .removalPolicy(RemovalPolicy.DESTROY) // optional for dev
                .build();

        ContainerDefinitionOptions.Builder containerOptions =
                ContainerDefinitionOptions.builder()
                        .image(ContainerImage.fromRegistry(imageName))
                        .portMappings(ports.stream()
                                .map(port -> PortMapping.builder()
                                        .containerPort(port)
                                        .hostPort(port)
                                        .protocol(Protocol.TCP)
                                        .build())
                                .toList())
                        .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                                .logGroup(logGroup)
                                .streamPrefix(imageName)
                                .build()));

        Map<String, String> envVars = new HashMap<>();
        envVars.put("SPRING_KAFKA_BOOTSTRAP_SERVERS", "localhost.localstack.cloud:4510, localhost.localstack.cloud:4511, localhost.localstack.cloud:4512");

        if(additionalEnvVars != null){
            envVars.putAll(additionalEnvVars);
        }

        if(db != null){
            envVars.put("SPRING_DATASOURCE_URL", "jdbc:postgresql://%s:%s/%s-db".formatted(
                    db.getDbInstanceEndpointAddress(),
                    db.getDbInstanceEndpointPort(),
                    imageName
            ));
            envVars.put("SPRING_DATASOURCE_USERNAME", "admin_user");
            envVars.put("SPRING_DATASOURCE_PASSWORD", db.getSecret().secretValueFromJson("password").toString());
            envVars.put("SPRING_JPA_HIBERNATE_DDL_AUTO", "update");
            envVars.put("SPRING_SQL_INIT_MODE", "always");
            envVars.put("SPRING_DATASOURCE_HIKARI_INITIALIZATION_FAIL_TIMEOUT", "60000");
        }
        containerOptions.environment(envVars);
        taskDefinition.addContainer(imageName + "Container", containerOptions.build());

        return FargateService.Builder.create(this, id)
                .cluster(ecsCluster)
                .taskDefinition(taskDefinition)
                .assignPublicIp(false)
                .serviceName(imageName)
                .build();

    }

    private void createApiGatewayService(){
        FargateTaskDefinition taskDefinition = FargateTaskDefinition.Builder.create(this, "APIGatewayTask")
                .cpu(256)
                .memoryLimitMiB(512)
                .build();

        LogGroup logGroup = LogGroup.Builder.create(this, "ApiGatewayLogGroup")
                .logGroupName("/ecs/api-gateway")
                .retention(RetentionDays.ONE_DAY) // optional
                .removalPolicy(RemovalPolicy.DESTROY) // optional for dev
                .build();

        ContainerDefinitionOptions containerOptions =
                ContainerDefinitionOptions.builder()
                        .image(ContainerImage.fromRegistry("api-gateway"))
                        .environment(Map.of(
                                "SPRING_PROFILES_ACTIVE", "prod",
                                "AUTH_SERVICE_URL", "http://auth-service.patientmanagement.local:4005"
                        ))
                        .portMappings(List.of(4004).stream()
                                .map(port -> PortMapping.builder()
                                        .containerPort(port)
                                        .hostPort(port)
                                        .protocol(Protocol.TCP)
                                        .build())
                                .toList())
                        .logging(LogDriver.awsLogs(AwsLogDriverProps.builder()
                                .logGroup(logGroup)
                                .streamPrefix("api-gateway")
                                .build()))
                        .build();

        taskDefinition.addContainer("ApiGatewayContainer", containerOptions);

        ApplicationLoadBalancedFargateService apiGateway =
                ApplicationLoadBalancedFargateService.Builder.create(this, "APIGatewayService")
                        .cluster(ecsCluster)
                        .serviceName("api-gateway")
                        .taskDefinition(taskDefinition)
                        .desiredCount(1)
                        .healthCheckGracePeriod(Duration.seconds(60))
                        .build();
    }

    public static void main(final String[] args) {
        App app = new App(AppProps.builder().outdir("./cdk.out").build());
        StackProps props = StackProps.builder()
                .synthesizer(new BootstraplessSynthesizer())
                .build();

        new LocalStack(app, "localstack", props);
        app.synth();
        System.out.println("App synthesizing in progress...");
    }
}
