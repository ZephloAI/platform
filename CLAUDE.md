
This project conatins several microservices for a llm agent as a website chatbot
- The services are
  - Agent: This contains the agent logic it's self.
  - api: This contains apis for managing and connecting to the agent.
  - crawler: This contains crawler for getting websites and indexing in a qdrant collewction.
  - frontend: Dasboard for setting and managing the agent chatbots.
  - widget: Widget for inserting into any website using a script tag.

- Create a team anytime you have to make changes to several services.

- Code simplicity is king, have in mind junior developers are going to maintian this system.

- Design is supposed to follow the apple design, make it feel polisheed, premium and well built

- When you make changes to any service kindly rebuild, upgrade alembic (if it is needed) and deploy the latest changes on docker