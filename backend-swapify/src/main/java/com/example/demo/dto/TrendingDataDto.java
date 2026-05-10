package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class TrendingDataDto {
    private List<String> skills;
    private List<String> categories;
    private List<UserProfileSummaryDto> users;
}