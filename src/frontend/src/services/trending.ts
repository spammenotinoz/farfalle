import { useState, useEffect } from "react";

export interface TrendingTopic {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
}

const HACKER_NEWS_API = "https://hacker-news.firebaseio.com/v0";

// Generate contextual trending topics based on time and categories
const getContextualTopics = (): TrendingTopic[] => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 17 && hour < 21;

  // Time-based greetings for dynamic content
  const timeGreeting = isMorning
    ? "Good morning! Here's what's trending"
    : isEvening
    ? "Good evening! Catch up on the latest"
    : "Here's what's happening today";

  // Categories with contextual queries
  const categories = [
    {
      name: "Technology",
      icon: "💻",
      queries: [
        "latest AI developments 2025",
        "new programming languages",
        "tech industry layoffs news",
        "Apple vs Samsung news",
        "cybersecurity threats 2025",
      ],
    },
    {
      name: "Science",
      icon: "🔬",
      queries: [
        "space exploration discoveries",
        "climate change research 2025",
        "medical breakthroughs",
        "physics discoveries",
        "renewable energy advances",
      ],
    },
    {
      name: "Business",
      icon: "📈",
      queries: [
        "stock market today",
        "crypto market analysis",
        "startup funding news",
        "economic forecasts 2025",
        "company earnings reports",
      ],
    },
    {
      name: "World",
      icon: "🌍",
      queries: [
        "latest world news today",
        "political elections 2025",
        "international relations",
        "global conflicts resolution",
        "UN summit decisions",
      ],
    },
    {
      name: "Entertainment",
      icon: "🎬",
      queries: [
        "new movies releasing",
        "celebrity news today",
        "music chart top songs",
        "video game releases 2025",
        "streaming platform updates",
      ],
    },
    {
      name: "Sports",
      icon: "⚽",
      queries: [
        "sports scores today",
        "Olympic 2024 results",
        "FIFA World Cup qualifiers",
        "NBA championship news",
        "tennis Grand Slam updates",
      ],
    },
  ];

  // Build topics from categories
  const topics: TrendingTopic[] = [];

  categories.forEach((category, catIndex) => {
    category.queries.forEach((query, queryIndex) => {
      topics.push({
        id: `topic-${catIndex}-${queryIndex}`,
        title: query,
        url: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
        source: category.name,
        category: category.name,
      });
    });
  });

  return topics;
};

// Fetch live stories from Hacker News
export const fetchHackerNewsStories = async (
  storyType: "top" | "new" | "best" = "top",
  limit: number = 10
): Promise<TrendingTopic[]> => {
  try {
    const response = await fetch(
      `${HACKER_NEWS_API}/${storyType}stories.json?print=pretty`
    );
    const storyIds: number[] = await response.json();
    const topStories = storyIds.slice(0, limit);

    const stories = await Promise.all(
      topStories.map(async (id) => {
        try {
          const storyResponse = await fetch(
            `${HACKER_NEWS_API}/item/${id}.json?print=pretty`
          );
          const story = await storyResponse.json();

          return {
            id: `hn-${id}`,
            title: story.title || "Untitled",
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            source: "Hacker News",
            category: "Technology",
          };
        } catch {
          return null;
        }
      })
    );

    return stories.filter((s): s is TrendingTopic => s !== null);
  } catch (error) {
    console.error("Failed to fetch Hacker News stories:", error);
    return getContextualTopics();
  }
};

export const useTrendingTopics = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from multiple sources
      const [hnStories] = await Promise.all([
        fetchHackerNewsStories("top", 6),
      ]);

      // Mix of live HN stories and contextual topics
      const contextual = getContextualTopics();

      // Shuffle and combine
      const shuffled = [...hnStories, ...contextual]
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);

      setTopics(shuffled);
    } catch (err) {
      setError("Failed to load trending topics");
      setTopics(getContextualTopics());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  return { topics, loading, error, refetch: loadTopics };
};

// Group topics by category for display
export const groupTopicsByCategory = (topics: TrendingTopic[]) => {
  const grouped: Record<string, TrendingTopic[]> = {};

  topics.forEach((topic) => {
    if (!grouped[topic.category]) {
      grouped[topic.category] = [];
    }
    grouped[topic.category].push(topic);
  });

  return grouped;
};
