package com.videograb.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility to resolve the real client IP behind Cloudflare / reverse proxy.
 * Priority: CF-Connecting-IP > X-Forwarded-For (first IP) > remoteAddr
 */
public final class ClientIpUtils {

    private ClientIpUtils() {}

    public static String resolve(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
