package com.chambreservice.configuration;

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
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        try {
            Map<String, Object> uploadOptions = new HashMap<>();
            uploadOptions.put("resource_type", "image");

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);
            Object url = uploadResult.get("secure_url");
            if (url == null) {
                throw new RuntimeException("Cloudinary upload succeeded but returned no URL");
            }
            return url.toString();
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }
}
