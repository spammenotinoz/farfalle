import { useEffect, useState } from "react";

export interface TrendingTopic {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
}

const HACKER_NEWS_API = "https://hacker-news.firebaseio.com/v0";

const getContextualTopics = (): TrendingTopic[] => {
  const categories = [
    {
      name: "Technology",
      queries: [
        "latest AI infrastructure market analysis",
        "cybersecurity regulation trends",
        "semiconductor supply chain risks",
        "open source AI model licensing comparison",
      ],
    },
    {
      name: "Science",
      queries: [
        "recent climate attribution research findings",
        "fusion energy private investment progress",
        "medical AI clinical validation evidence",
        "space launch market economics",
      ],
    },
    {
      name: "Business",
      queries: [
        "private credit market systemic risk analysis",
        "enterprise software spending trends",
        "AI chip demand forecast evidence",
        "renewable energy project finance constraints",
      ],
    },
    {
      name: "World",
      queries: [
        "global rare earths supply chain geopolitics",
        "election misinformation policy comparison",
        "shipping route disruption economic impact",
        "food security climate risk analysis",
      ],
    },
    {
      name: "Policy",
      queries: [
        "AI regulation comparison United States European Union",
        "carbon border adjustment mechanism impact",
        "privacy law enforcement trends",
        "public procurement AI governance research",
      ],
    },
    {
      name: "Strategy",
      queries: [
        "build vs buy AI agents enterprise strategy",
        "data center power procurement strategy",
        "vendor lock-in risks cloud AI platforms",
        "go-to-market lessons from vertical SaaS companies",
      ],
    },
  ];

  return categories.flatMap((category, categoryIndex) =>
    category.queries.map((query, queryIndex) => ({
      id: `topic-${categoryIndex}-${queryIndex}`,
      title: query,
      url: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
      source: category.name,
      category: category.name,
    })),
  );
};

export const fetchHackerNewsStories = async (
  storyType: "top" | "new" | "best" = "top",
  limit: number = 6,
): Promise<TrendingTopic[]> => {
  try {
    const response = await fetch(
      `${HACKER_NEWS_API}/${storyType}stories.json?print=pretty`,
    );
    const storyIds: number[] = await response.json();
    const topStories = storyIds.slice(0, limit);

    const stories = await Promise.all(
      topStories.map(async (id) => {
        try {
          const storyResponse = await fetch(
            `${HACKER_NEWS_API}/item/${id}.json?print=pretty`,
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
      }),
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

      const [hnStories] = await Promise.all([fetchHackerNewsStories("top", 6)]);
      const contextual = getContextualTopics();
      const shuffled = [...hnStories, ...contextual]
        .sort(() => Math.random() - 0.5)
        .slice(0, 14);

      setTopics(shuffled);
    } catch {
      setError("Failed to load live topics");
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
