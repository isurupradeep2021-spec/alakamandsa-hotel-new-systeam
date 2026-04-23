package com.hotelpayroll.security;

import com.hotelpayroll.entity.User;
import com.hotelpayroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(Stream.concat(
                                Stream.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                                RolePermissions.forRole(user.getRole()).stream()
                                        .map(permission -> new SimpleGrantedAuthority(permission.name()))
                        )
                        .toList())
                .disabled(!user.isEnabled())
                .build();
    }
}
