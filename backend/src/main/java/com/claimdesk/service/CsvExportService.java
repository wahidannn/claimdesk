package com.claimdesk.service;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class CsvExportService {

    public String toCsv(List<String> headers, List<List<String>> rows) {
        StringBuilder builder = new StringBuilder();
        appendRow(builder, headers);
        rows.forEach(row -> appendRow(builder, row));
        return builder.toString();
    }

    private void appendRow(StringBuilder builder, List<String> row) {
        for (int index = 0; index < row.size(); index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(escape(row.get(index)));
        }
        builder.append('\n');
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }

        boolean shouldQuote = value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r");
        String escaped = value.replace("\"", "\"\"");
        return shouldQuote ? "\"" + escaped + "\"" : escaped;
    }
}
