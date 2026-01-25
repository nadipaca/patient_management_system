package com.pm.patientservice.config;

import org.h2.server.web.JakartaWebServlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class H2ConsoleConfig {

    @Bean
    public ServletRegistrationBean<JakartaWebServlet> h2ConsoleServlet() {
        ServletRegistrationBean<JakartaWebServlet> servlet =
                new ServletRegistrationBean<>(new JakartaWebServlet(), "/h2-console/*");
        servlet.setLoadOnStartup(1);
        return servlet;
    }
}