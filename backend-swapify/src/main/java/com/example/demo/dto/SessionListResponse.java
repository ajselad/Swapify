package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class SessionListResponse {
    private List<SessionDto> content;
    private Integer totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer pageSize;
    private Boolean hasNext;
    private Boolean hasPrevious;

    public SessionListResponse(List<SessionDto> content, Integer totalElements,
                               Integer totalPages, Integer currentPage,
                               Integer pageSize, Boolean hasNext, Boolean hasPrevious) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.hasNext = hasNext;
        this.hasPrevious = hasPrevious;
    }
}