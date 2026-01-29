package com.pm.authservice.service;

import com.pm.authservice.model.User;
import com.pm.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@Service
public class UserService {
    public final UserRepository userRespository;

    public UserService(UserRepository userRespository) {
        this.userRespository = userRespository;
    }

    public Optional<User> findByEmail(String email){
        return userRespository.findByEmail(email);
    }
}
