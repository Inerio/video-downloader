package com.videograb.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class PlatformDetectorService {

    private static final Map<Pattern, String> PLATFORM_PATTERNS = Map.ofEntries(
            Map.entry(Pattern.compile("(youtube\\.com|youtu\\.be)"), "youtube"),
            Map.entry(Pattern.compile("tiktok\\.com"), "tiktok"),
            Map.entry(Pattern.compile("instagram\\.com"), "instagram"),
            Map.entry(Pattern.compile("(x\\.com|twitter\\.com)"), "twitter"),
            Map.entry(Pattern.compile("(facebook\\.com|fb\\.watch)"), "facebook"),
            Map.entry(Pattern.compile("reddit\\.com"), "reddit"),
            Map.entry(Pattern.compile("vimeo\\.com"), "vimeo"),
            Map.entry(Pattern.compile("dailymotion\\.com"), "dailymotion"),
            Map.entry(Pattern.compile("(twitch\\.tv|clips\\.twitch\\.tv)"), "twitch"),
            Map.entry(Pattern.compile("pinterest\\.com"), "pinterest"),
            Map.entry(Pattern.compile("snapchat\\.com"), "snapchat"),
            Map.entry(Pattern.compile("linkedin\\.com"), "linkedin")
    );

    public String detect(String url) {
        try {
            String host = URI.create(url).getHost();
            if (host == null) return "unknown";

            for (var entry : PLATFORM_PATTERNS.entrySet()) {
                if (entry.getKey().matcher(host).find()) {
                    return entry.getValue();
                }
            }
        } catch (Exception e) {
            // malformed URL
        }
        return "unknown";
    }
}
