const decisionTree = {
  start: {
    message: "Hi there! What would you like to explore?",
    options: [
      { label: "AI Chatbots", next: "ai" },
      { label: "Web/Mobile Apps", next: "apps" },
      { label: "Something else", next: "freeInput" }
    ]
  },
  ai: {
    message: "We build intelligent AI-first chat agents. Want to see a demo?",
    options: [
      { label: "Yes", next: "demo" },
      { label: "Go Back", next: "start" }
    ]
  },
  apps: {
    message: "We create robust cross-platform apps. Want to learn more?",
    options: [
      { label: "Yes", next: "freeInput" },
      { label: "Go Back", next: "start" }
    ]
  },
  demo: {
    message: "Visit https://codepackers.com to experience our live demos!",
    options: [
      { label: "Explore More", next: "start" }
    ]
  },
  freeInput: {
    message: "Feel free to ask anything or share your idea. I'm listening!"
  }
};

export default decisionTree;
