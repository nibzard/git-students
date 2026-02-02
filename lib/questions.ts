export type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number;
  isControl?: boolean;
};

export const quizConfig = {
  totalTimeLimitSeconds: 25 * 60,
  emailDomain: "pmfst.hr",
};

export const questions: Question[] = [
  {
    id: 1,
    text: "What is Git primarily used for?",
    options: [
      "Hosting websites",
      "Version control (tracking changes in files)",
      "Writing code faster",
      "Running code online",
    ],
    correctIndex: 1,
    timeLimitSeconds: 45,
  },
  {
    id: 2,
    text: "What is GitHub primarily used for?",
    options: [
      "A cloud service to store and collaborate on Git repositories",
      "A programming language",
      "A text editor",
      "A database",
    ],
    correctIndex: 0,
    timeLimitSeconds: 45,
  },
  {
    id: 3,
    text: "Which command creates a new local Git repository in the current folder?",
    options: ["git start", "git init", "git clone", "git new"],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 4,
    text: "Which command shows the current status (staged/unstaged changes)?",
    options: ["git status", "git check", "git log", "git diff --all"],
    correctIndex: 0,
    timeLimitSeconds: 40,
  },
  {
    id: 5,
    text: "What does git add . do?",
    options: [
      "Uploads files to GitHub",
      "Stages changes in the current directory for commit",
      "Deletes untracked files",
      "Creates a new branch",
    ],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 6,
    text: "What does git commit do?",
    options: [
      "Saves a snapshot of staged changes in the local repo",
      "Uploads your files to GitHub",
      "Downloads changes from GitHub",
      "Removes changes",
    ],
    correctIndex: 0,
    timeLimitSeconds: 40,
  },
  {
    id: 7,
    text: "Which command is typically used to upload local commits to a remote repository?",
    options: ["git upload", "git push", "git send", "git publish"],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 8,
    text: "Which command downloads commits from a remote and merges them into your current branch?",
    options: ["git pull", "git fetch", "git download", "git merge --remote"],
    correctIndex: 0,
    timeLimitSeconds: 40,
  },
  {
    id: 9,
    text: "What is a branch in Git?",
    options: [
      "A copy of your computer",
      "A separate line of development",
      "A folder on GitHub",
      "A backup of all files",
    ],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 10,
    text: "What is a merge conflict?",
    options: [
      "GitHub server is down",
      "Two branches changed the same part of a file in incompatible ways",
      "Your password is wrong",
      "You forgot to commit",
    ],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 11,
    text: "In the typical local workflow, what comes right after git add?",
    options: ["git pull", "git commit", "git clone", "git fork"],
    correctIndex: 1,
    timeLimitSeconds: 40,
  },
  {
    id: 12,
    text: "What does origin usually refer to in Git?",
    options: [
      "Your current branch name",
      "The default name for the remote you cloned from (often your fork on GitHub)",
      "The first commit in the project",
      "A backup folder Git creates automatically",
    ],
    correctIndex: 1,
    timeLimitSeconds: 45,
  },
  {
    id: 13,
    text: "What is the purpose of a .gitignore file?",
    options: [
      "It encrypts your repository so others can’t see it",
      "It tells Git which files/folders to ignore so they won't be tracked/committed",
      "It automatically fixes merge conflicts",
      "It syncs your repo with GitHub every minute",
    ],
    correctIndex: 1,
    timeLimitSeconds: 45,
  },
  {
    id: 14,
    text: "Which statement best describes git clone?",
    options: [
      "Copies a remote repository to your computer for the first time",
      "Uploads your local repo to GitHub",
      "Deletes a repository",
      "Renames a repository",
    ],
    correctIndex: 0,
    timeLimitSeconds: 40,
  },
  {
    id: 15,
    text: "Which statement best describes a Pull Request (PR)?",
    options: [
      "A way to delete commits from history",
      "A request to merge your changes (usually from a branch/fork) into another repo/branch",
      "A command that downloads updates from GitHub",
      "A tool that automatically writes commit messages",
    ],
    correctIndex: 1,
    timeLimitSeconds: 45,
  },
  {
    id: 16,
    text: "You edit README.md, and a new file notes.txt appears that you do not want in the repo. What is the best Git/GitHub concept for this?",
    options: [
      "Add notes.txt to .gitignore so it’s not tracked",
      "Put notes.txt into the .git folder",
      "Commit it and delete it later",
      "Rename it to README2.md",
    ],
    correctIndex: 0,
    timeLimitSeconds: 45,
  },
  {
    id: 17,
    text: "In a \"teacher repo -> student fork -> PR back\" workflow, what is the most common reason students' PRs get messy or conflicts increase?",
    options: [
      "They forget to star the repository on GitHub",
      "They work on their fork without syncing it with the teacher repo first",
      "They use too many commit messages",
      "They push their project into the README.md file",
    ],
    correctIndex: 1,
    timeLimitSeconds: 45,
  },
  {
    id: 18,
    text: "True/False: \"If I commit, my changes are automatically on GitHub.\"",
    options: ["True", "False"],
    correctIndex: 1,
    timeLimitSeconds: 25,
  },
  {
    id: 19,
    text: "True/False: \"A repository can exist only locally, without GitHub.\"",
    options: ["True", "False"],
    correctIndex: 0,
    timeLimitSeconds: 25,
  },
  {
    id: 20,
    text: "True/False: \"A fork is a copy of a repository under your own GitHub account.\"",
    options: ["True", "False"],
    correctIndex: 0,
    timeLimitSeconds: 25,
  },
  {
    id: 21,
    text: "True/False: \"If your fork is behind the teacher repo, you should sync it before starting new work.\"",
    options: ["True", "False"],
    correctIndex: 0,
    timeLimitSeconds: 25,
  },
  {
    id: 22,
    text: "Which Git command starts tracking changes in a brand new local folder?",
    options: ["git begin", "git init", "git clone", "git create"],
    correctIndex: 1,
    timeLimitSeconds: 35,
    isControl: true,
  },
  {
    id: 23,
    text: "What command lets you see which files are staged or unstaged right now?",
    options: ["git status", "git check", "git log", "git diff --all"],
    correctIndex: 0,
    timeLimitSeconds: 35,
    isControl: true,
  },
  {
    id: 24,
    text: "Which option best explains a Pull Request (PR)?",
    options: [
      "A request to merge your changes into another branch or repo",
      "A command that downloads updates from GitHub",
      "A way to delete commits from history",
      "A tool that auto-writes commit messages",
    ],
    correctIndex: 0,
    timeLimitSeconds: 40,
    isControl: true,
  },
];

export const questionMap = new Map(questions.map((q) => [q.id, q]));
export const controlQuestionIds = questions.filter((q) => q.isControl).map((q) => q.id);
