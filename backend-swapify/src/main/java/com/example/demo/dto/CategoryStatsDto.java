package com.example.demo.dto;

import lombok.Data;

@Data
public class CategoryStatsDto {
    private String category;
    private String iconClass;
    private int skillCount;
    private int userCount;
    private int swapCount;
    private boolean isPopular;
}
