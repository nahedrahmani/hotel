package com.clientservice.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf"
    );

    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF");
        }
        try {
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "auto");
            Map result = cloudinary.uploader().upload(file.getBytes(), options);
            Object url = result.get("secure_url");
            if (url == null) {
                throw new RuntimeException("Cloudinary upload succeeded but returned no URL");
            }
            return url.toString();
        } catch (IOException e) {
            throw new RuntimeException("Document upload failed: " + e.getMessage());
        }
    }
}
