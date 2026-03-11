package com.videograb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class VideoGrabApplication {

    public static void main(String[] args) {
        SpringApplication.run(VideoGrabApplication.class, args);
    }
}
