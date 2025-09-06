# betterplace.org Explorer

A tool to quickly find Organisations, Projects, and Fundraising Events based on user information like name or ID.

---

## 🔍 What It Does

This tool is designed to be a fast way to look up information. It solves the common problem of needing to find an entity without knowing its exact ID or title. By indexing all Organisations, Projects, and Fundraising Events locally in your browser, it provides instant, powerful search capabilities that work even when you're offline.

## ✨ Core Features

### 1. Powerful, Multi-Modal Search

The application offers three distinct and optimized ways to search:

-   **Search by ID**: The most direct way to find an item. Simply enter the numeric ID of an Organisation, Project, or Fundraising Event to pull up its details instantly.

-   **Search by Contact Name**: Find all entities associated with a specific person. This search is designed to be flexible and understands various name formats:
    -   **Full Name**: e.g., `Detlev Zander`
    -   **Last Name Only**: e.g., `Zander`
    -   **Initial and Last Name**: e.g., `D. Zander`

-   **Search by Organisation Name**: A powerful fuzzy search to find organisations even if you don't know the exact name.
    -   It matches partial names and words within the organisation's title.
    -   It uses a Levenshtein distance algorithm to find close matches, correcting for minor typos.
    -   When you search for an organisation, the tool also **automatically fetches and displays all associated projects** for that organisation.

### 2. Comprehensive Data Display

Search results are presented in clear, actionable cards, each packed with relevant information:

-   **Organisation Cards**:
    -   Name (with a direct link to the platform page)
    -   Organisation ID
    -   Contact Person's Name and ID

-   **Project Cards**:
    -   Visual status indicator (Green for Open, Gray for Closed, Red for Blocked)
    -   Title (with a direct link to the platform page) and Project ID
    -   Carrier Organisation Name
    -   Contact Person's Name and ID
    -   Key financial data: Total Donations Received
    -   Status: Incomplete Needs count, or "Financed" status with completion date.
    -   Important dates: Activated At and Last Updated.

-   **Fundraising Event Cards**:
    -   Title (with a direct link to the platform page) and Event ID
    -   Status (Open or Closed with date)
    -   Contact Person's Name and ID
    -   Total Donations Received
    -   A list of all **Featured Projects** associated with the event.
    -   Important dates: Created At and Last Updated.

### 3. Offline-First Architecture

-   **Instant Load**: The application aggressively caches all API data in your browser's IndexedDB. After the initial sync, the app loads instantly and is fully operational offline.
-   **Smart Background Sync**: On startup, the app loads the local data immediately for a fast, responsive experience. It then checks for updates from the betterplace.org API in the background, ensuring your data is always fresh without blocking the UI.

## 🚀 Tech Stack

-   **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Client-Side Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for robust offline caching.

---

## 🛠️ Getting Started

Follow these instructions to set up and run the project on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18.x or newer recommended)
-   [Git](https://git-scm.com/)

### Installation & Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd your-repository-name
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal). The app will perform its initial data sync, which may take a minute. Subsequent loads will be instantaneous.

---

## 🌐 Deployment

This project is configured for a seamless deployment experience with modern hosting providers like Vercel or Netlify.

### Deploying with Vercel (Recommended)

1.  **Push your code to GitHub:** Ensure your latest code, including the `package.json` and `vite.config.js` files, is pushed to your GitHub repository.

2.  **Import Project on Vercel:**
    -   Sign up for a free account on [Vercel](https://vercel.com/) with your GitHub account.
    -   Click "Add New..." -> "Project" on your dashboard.
    -   Select your project repository from the list.

3.  **Configure and Deploy:**
    -   Vercel will automatically detect that this is a Vite project.
    -   The build settings should be configured automatically:
        -   **Build Command**: `vite build` or `npm run build`
        -   **Output Directory**: `dist`
    -   Click **Deploy**.

Vercel will build and deploy your application, providing you with a public URL. Any subsequent pushes to your `main` branch on GitHub will automatically trigger a new deployment.
