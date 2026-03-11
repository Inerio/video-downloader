package com.videograb.exception;

public class VideoNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public VideoNotFoundException(String message) {
        super(message);
    }
}
