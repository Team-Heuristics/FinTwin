package com.fintwin.util;

import com.fintwin.model.Transaction.TransactionCategory;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Utility for keyword-based transaction categorization and description normalization.
 */
@Component
public class TransactionCategorizationUtil {

    /**
     * Known subscription services mapped to normalized names.
     */
    private static final Map<String, String> SUBSCRIPTION_KEYWORDS = Map.ofEntries(
            Map.entry("netflix", "Netflix"),
            Map.entry("spotify", "Spotify"),
            Map.entry("amazon prime", "Amazon Prime"),
            Map.entry("prime video", "Amazon Prime"),
            Map.entry("hotstar", "Disney+ Hotstar"),
            Map.entry("disney", "Disney+ Hotstar"),
            Map.entry("zee5", "ZEE5"),
            Map.entry("sonyliv", "SonyLIV"),
            Map.entry("youtube premium", "YouTube Premium"),
            Map.entry("apple music", "Apple Music"),
            Map.entry("apple tv", "Apple TV+"),
            Map.entry("microsoft 365", "Microsoft 365"),
            Map.entry("office 365", "Microsoft 365"),
            Map.entry("google one", "Google One"),
            Map.entry("adobe", "Adobe Creative Cloud"),
            Map.entry("dropbox", "Dropbox"),
            Map.entry("slack", "Slack"),
            Map.entry("notion", "Notion"),
            Map.entry("github", "GitHub"),
            Map.entry("jio", "Jio"),
            Map.entry("airtel", "Airtel"),
            Map.entry("bsnl", "BSNL"),
            Map.entry("vodafone", "Vodafone"),
            Map.entry("vi ", "Vi")
    );

    /**
     * Category keyword mappings.
     */
    private static final Map<String, TransactionCategory> CATEGORY_KEYWORDS = Map.ofEntries(
            // Food
            Map.entry("swiggy", TransactionCategory.FOOD),
            Map.entry("zomato", TransactionCategory.FOOD),
            Map.entry("dominos", TransactionCategory.FOOD),
            Map.entry("pizza", TransactionCategory.FOOD),
            Map.entry("mcdonald", TransactionCategory.FOOD),
            Map.entry("kfc", TransactionCategory.FOOD),
            Map.entry("subway", TransactionCategory.FOOD),
            Map.entry("restaurant", TransactionCategory.FOOD),
            Map.entry("cafe", TransactionCategory.FOOD),
            Map.entry("food", TransactionCategory.FOOD),
            Map.entry("eat", TransactionCategory.FOOD),
            Map.entry("dinner", TransactionCategory.FOOD),
            Map.entry("lunch", TransactionCategory.FOOD),
            Map.entry("breakfast", TransactionCategory.FOOD),
            Map.entry("grocery", TransactionCategory.FOOD),
            Map.entry("bigbasket", TransactionCategory.FOOD),
            Map.entry("blinkit", TransactionCategory.FOOD),
            Map.entry("dunzo", TransactionCategory.FOOD),
            // Shopping
            Map.entry("amazon", TransactionCategory.SHOPPING),
            Map.entry("flipkart", TransactionCategory.SHOPPING),
            Map.entry("myntra", TransactionCategory.SHOPPING),
            Map.entry("nykaa", TransactionCategory.SHOPPING),
            Map.entry("meesho", TransactionCategory.SHOPPING),
            Map.entry("ajio", TransactionCategory.SHOPPING),
            Map.entry("shopping", TransactionCategory.SHOPPING),
            Map.entry("store", TransactionCategory.SHOPPING),
            Map.entry("mart", TransactionCategory.SHOPPING),
            // Transport
            Map.entry("uber", TransactionCategory.TRANSPORT),
            Map.entry("ola", TransactionCategory.TRANSPORT),
            Map.entry("rapido", TransactionCategory.TRANSPORT),
            Map.entry("metro", TransactionCategory.TRANSPORT),
            Map.entry("petrol", TransactionCategory.TRANSPORT),
            Map.entry("fuel", TransactionCategory.TRANSPORT),
            Map.entry("irctc", TransactionCategory.TRANSPORT),
            Map.entry("flight", TransactionCategory.TRANSPORT),
            Map.entry("indigo", TransactionCategory.TRANSPORT),
            Map.entry("air india", TransactionCategory.TRANSPORT),
            Map.entry("bus", TransactionCategory.TRANSPORT),
            Map.entry("train", TransactionCategory.TRANSPORT),
            // Education
            Map.entry("udemy", TransactionCategory.EDUCATION),
            Map.entry("coursera", TransactionCategory.EDUCATION),
            Map.entry("byju", TransactionCategory.EDUCATION),
            Map.entry("unacademy", TransactionCategory.EDUCATION),
            Map.entry("school", TransactionCategory.EDUCATION),
            Map.entry("college", TransactionCategory.EDUCATION),
            Map.entry("university", TransactionCategory.EDUCATION),
            Map.entry("tuition", TransactionCategory.EDUCATION),
            Map.entry("book", TransactionCategory.EDUCATION),
            Map.entry("course", TransactionCategory.EDUCATION)
    );

            /**
             * Keywords typically indicating income/credits and non-spending inflows.
             */
            private static final String[] INCOME_KEYWORDS = new String[] {
                "salary", "credit", "refund", "interest", "dividend", "freelance", "cashback", "reversal"
            };

    /**
     * Normalize a description: lowercase, trim, remove special chars.
     */
    public String normalize(String description) {
        if (description == null) return "";
        return description.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Categorize a transaction based on its description.
     */
    public TransactionCategory categorize(String description) {
        if (description == null) return TransactionCategory.MISCELLANEOUS;

        String normalized = normalize(description);

        // Check subscription keywords first
        for (String keyword : SUBSCRIPTION_KEYWORDS.keySet()) {
            if (normalized.contains(keyword)) {
                return TransactionCategory.SUBSCRIPTIONS;
            }
        }

        // Check category keywords
        for (Map.Entry<String, TransactionCategory> entry : CATEGORY_KEYWORDS.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return TransactionCategory.MISCELLANEOUS;
    }

    /**
     * Check if a transaction is a known subscription service.
     */
    public boolean isSubscription(String description) {
        if (description == null) return false;
        String normalized = normalize(description);
        for (String keyword : SUBSCRIPTION_KEYWORDS.keySet()) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the normalized subscription service name, or null if not a subscription.
     */
    public String getSubscriptionServiceName(String description) {
        if (description == null) return null;
        String normalized = normalize(description);
        for (Map.Entry<String, String> entry : SUBSCRIPTION_KEYWORDS.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    /**
     * Detect whether a transaction description likely represents income/credit inflow.
     */
    public boolean isIncomeLike(String description) {
        if (description == null) return false;
        String normalized = normalize(description);
        for (String keyword : INCOME_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
