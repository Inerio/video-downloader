package com.videograb.exception;

public class DownloadException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public DownloadException(String message) {
        super(message);
    }

    public DownloadException(String message, Throwable cause) {
        super(message, cause);
    }
}
