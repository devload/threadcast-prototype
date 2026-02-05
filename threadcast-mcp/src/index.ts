#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================================================
// Project Scanner - Analyzes project structure and extracts metadata
// ============================================================================

interface ProjectMeta {
  project: {
    name: string;
    type: "single" | "monorepo";
    modules?: string[];
    description?: string;
    version?: string;
  };
  stack: {
    languages: string[];
    frameworks: string[];
    buildTools: string[];
    packageManagers: string[];
  };
  git?: {
    remote?: string;
    branch?: string;
    mainBranch?: string;
    lastCommit?: {
      hash: string;
      message: string;
      author: string;
      date: string;
    };
  };
  structure: {
    rootFiles: string[];
    directories: string[];
    entryPoints?: Record<string, string>;
  };
  dependencies?: {
    production: string[];
    development: string[];
  };
  scripts?: Record<string, string>;
  scannedAt: string;
}

class ProjectScanner {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async scan(): Promise<ProjectMeta> {
    const meta: ProjectMeta = {
      project: {
        name: path.basename(this.projectPath),
        type: "single",
      },
      stack: {
        languages: [],
        frameworks: [],
        buildTools: [],
        packageManagers: [],
      },
      structure: {
        rootFiles: [],
        directories: [],
      },
      scannedAt: new Date().toISOString(),
    };

    // Scan root directory
    this.scanRootDirectory(meta);

    // Detect project type and modules
    this.detectProjectType(meta);

    // Scan package files
    await this.scanPackageJson(meta);
    await this.scanGradle(meta);
    await this.scanPom(meta);

    // Scan Git info
    this.scanGitInfo(meta);

    // Detect frameworks
    this.detectFrameworks(meta);

    // Detect structure
    this.detectStructure(meta);

    return meta;
  }

  private scanRootDirectory(meta: ProjectMeta): void {
    try {
      const entries = fs.readdirSync(this.projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith(".") && entry.name !== ".gitignore") continue;

        if (entry.isDirectory()) {
          meta.structure.directories.push(entry.name);
        } else if (entry.isFile()) {
          meta.structure.rootFiles.push(entry.name);
        }
      }
    } catch (e) {
      console.error("Failed to scan root directory:", e);
    }
  }

  private detectProjectType(meta: ProjectMeta): void {
    const dirs = meta.structure.directories;
    const potentialModules: string[] = [];

    // Check for monorepo patterns
    for (const dir of dirs) {
      const dirPath = path.join(this.projectPath, dir);

      // Check if directory has its own package.json or build file
      if (
        fs.existsSync(path.join(dirPath, "package.json")) ||
        fs.existsSync(path.join(dirPath, "build.gradle")) ||
        fs.existsSync(path.join(dirPath, "pom.xml"))
      ) {
        potentialModules.push(dir);
      }
    }

    // Check for common monorepo structures
    if (
      potentialModules.length > 1 ||
      dirs.includes("packages") ||
      dirs.includes("apps") ||
      fs.existsSync(path.join(this.projectPath, "lerna.json")) ||
      fs.existsSync(path.join(this.projectPath, "pnpm-workspace.yaml"))
    ) {
      meta.project.type = "monorepo";
      meta.project.modules = potentialModules;
    }
  }

  private async scanPackageJson(meta: ProjectMeta): Promise<void> {
    const pkgPath = path.join(this.projectPath, "package.json");

    if (!fs.existsSync(pkgPath)) return;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      meta.project.name = pkg.name || meta.project.name;
      meta.project.description = pkg.description;
      meta.project.version = pkg.version;

      if (!meta.stack.languages.includes("typescript") &&
          !meta.stack.languages.includes("javascript")) {
        if (pkg.devDependencies?.typescript || fs.existsSync(path.join(this.projectPath, "tsconfig.json"))) {
          meta.stack.languages.push("typescript");
        } else {
          meta.stack.languages.push("javascript");
        }
      }

      meta.stack.packageManagers.push("npm");

      // Check for pnpm or yarn
      if (fs.existsSync(path.join(this.projectPath, "pnpm-lock.yaml"))) {
        meta.stack.packageManagers = ["pnpm"];
      } else if (fs.existsSync(path.join(this.projectPath, "yarn.lock"))) {
        meta.stack.packageManagers = ["yarn"];
      }

      // Extract dependencies
      const prodDeps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});

      meta.dependencies = {
        production: prodDeps.slice(0, 20), // Limit to top 20
        development: devDeps.slice(0, 20),
      };

      // Extract scripts
      if (pkg.scripts) {
        meta.scripts = pkg.scripts;
      }

      // Detect build tools
      if (devDeps.includes("vite") || prodDeps.includes("vite")) {
        meta.stack.buildTools.push("vite");
      }
      if (devDeps.includes("webpack") || prodDeps.includes("webpack")) {
        meta.stack.buildTools.push("webpack");
      }
      if (devDeps.includes("esbuild") || prodDeps.includes("esbuild")) {
        meta.stack.buildTools.push("esbuild");
      }
      if (devDeps.includes("rollup") || prodDeps.includes("rollup")) {
        meta.stack.buildTools.push("rollup");
      }

    } catch (e) {
      console.error("Failed to parse package.json:", e);
    }
  }

  private async scanGradle(meta: ProjectMeta): Promise<void> {
    const gradlePath = path.join(this.projectPath, "build.gradle");
    const gradleKtsPath = path.join(this.projectPath, "build.gradle.kts");
    const settingsPath = path.join(this.projectPath, "settings.gradle");

    if (!fs.existsSync(gradlePath) && !fs.existsSync(gradleKtsPath)) return;

    if (!meta.stack.languages.includes("java") && !meta.stack.languages.includes("kotlin")) {
      if (fs.existsSync(gradleKtsPath)) {
        meta.stack.languages.push("kotlin");
      }
      meta.stack.languages.push("java");
    }

    meta.stack.buildTools.push("gradle");

    try {
      const buildFile = fs.existsSync(gradleKtsPath)
        ? fs.readFileSync(gradleKtsPath, "utf-8")
        : fs.readFileSync(gradlePath, "utf-8");

      // Detect Spring Boot
      if (buildFile.includes("org.springframework.boot") || buildFile.includes("spring-boot")) {
        meta.stack.frameworks.push("spring-boot");
      }

      // Get project name from settings.gradle
      if (fs.existsSync(settingsPath)) {
        const settings = fs.readFileSync(settingsPath, "utf-8");
        const nameMatch = settings.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
        if (nameMatch) {
          meta.project.name = nameMatch[1];
        }

        // Get subprojects
        const includeMatches = settings.matchAll(/include\s*\(?['"]([^'"]+)['"]\)?/g);
        const subprojects: string[] = [];
        for (const match of includeMatches) {
          subprojects.push(match[1].replace(":", ""));
        }
        if (subprojects.length > 0) {
          meta.project.type = "monorepo";
          meta.project.modules = [...(meta.project.modules || []), ...subprojects];
        }
      }
    } catch (e) {
      console.error("Failed to parse Gradle files:", e);
    }
  }

  private async scanPom(meta: ProjectMeta): Promise<void> {
    const pomPath = path.join(this.projectPath, "pom.xml");

    if (!fs.existsSync(pomPath)) return;

    if (!meta.stack.languages.includes("java")) {
      meta.stack.languages.push("java");
    }
    meta.stack.buildTools.push("maven");

    try {
      const pom = fs.readFileSync(pomPath, "utf-8");

      // Extract artifact ID
      const artifactMatch = pom.match(/<artifactId>([^<]+)<\/artifactId>/);
      if (artifactMatch) {
        meta.project.name = artifactMatch[1];
      }

      // Detect Spring Boot
      if (pom.includes("spring-boot")) {
        meta.stack.frameworks.push("spring-boot");
      }
    } catch (e) {
      console.error("Failed to parse pom.xml:", e);
    }
  }

  private scanGitInfo(meta: ProjectMeta): void {
    const gitDir = path.join(this.projectPath, ".git");
    if (!fs.existsSync(gitDir)) return;

    try {
      meta.git = {};

      // Get current branch
      try {
        meta.git.branch = execSync("git rev-parse --abbrev-ref HEAD", {
          cwd: this.projectPath,
          encoding: "utf-8",
        }).trim();
      } catch (e) {
        // Ignore
      }

      // Get remote URL
      try {
        const remoteUrl = execSync("git remote get-url origin", {
          cwd: this.projectPath,
          encoding: "utf-8",
        }).trim();
        // Clean up SSH URL to readable format
        meta.git.remote = remoteUrl
          .replace(/^git@github\.com:/, "github.com/")
          .replace(/\.git$/, "");
      } catch (e) {
        // Ignore
      }

      // Detect main branch
      try {
        const branches = execSync("git branch -r", {
          cwd: this.projectPath,
          encoding: "utf-8",
        });
        if (branches.includes("origin/main")) {
          meta.git.mainBranch = "main";
        } else if (branches.includes("origin/master")) {
          meta.git.mainBranch = "master";
        }
      } catch (e) {
        // Ignore
      }

      // Get last commit
      try {
        const logOutput = execSync(
          'git log -1 --format="%H|%s|%an|%aI"',
          { cwd: this.projectPath, encoding: "utf-8" }
        ).trim();
        const [hash, message, author, date] = logOutput.split("|");
        meta.git.lastCommit = {
          hash: hash.substring(0, 8),
          message,
          author,
          date,
        };
      } catch (e) {
        // Ignore
      }
    } catch (e) {
      console.error("Failed to scan Git info:", e);
    }
  }

  private detectFrameworks(meta: ProjectMeta): void {
    const deps = [
      ...(meta.dependencies?.production || []),
      ...(meta.dependencies?.development || []),
    ];

    // React
    if (deps.includes("react") || deps.includes("react-dom")) {
      meta.stack.frameworks.push("react");
    }

    // Vue
    if (deps.includes("vue")) {
      meta.stack.frameworks.push("vue");
    }

    // Next.js
    if (deps.includes("next")) {
      meta.stack.frameworks.push("next.js");
    }

    // Express
    if (deps.includes("express")) {
      meta.stack.frameworks.push("express");
    }

    // NestJS
    if (deps.includes("@nestjs/core")) {
      meta.stack.frameworks.push("nestjs");
    }

    // Tailwind
    if (deps.includes("tailwindcss")) {
      meta.stack.frameworks.push("tailwindcss");
    }

    // Remove duplicates
    meta.stack.frameworks = [...new Set(meta.stack.frameworks)];
  }

  private detectStructure(meta: ProjectMeta): void {
    const entryPoints: Record<string, string> = {};

    // Detect common entry points
    const checkPaths: [string, string][] = [
      ["src/index.ts", "frontend-entry"],
      ["src/index.tsx", "frontend-entry"],
      ["src/main.ts", "frontend-entry"],
      ["src/main.tsx", "frontend-entry"],
      ["src/App.tsx", "react-app"],
      ["src/App.vue", "vue-app"],
      ["src/main/java", "java-source"],
      ["src/main/kotlin", "kotlin-source"],
      ["src/main/resources/application.yml", "spring-config"],
      ["src/main/resources/application.properties", "spring-config"],
    ];

    for (const [checkPath, label] of checkPaths) {
      if (fs.existsSync(path.join(this.projectPath, checkPath))) {
        entryPoints[label] = checkPath;
      }
    }

    // Detect API controllers for Spring
    const controllersPath = path.join(this.projectPath, "src/main/java");
    if (fs.existsSync(controllersPath)) {
      try {
        const findControllers = (dir: string): string[] => {
          const results: string[] = [];
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (entry.name === "controller" || entry.name === "controllers") {
                results.push(fullPath.replace(this.projectPath + "/", ""));
              } else {
                results.push(...findControllers(fullPath));
              }
            }
          }
          return results;
        };

        const controllerDirs = findControllers(controllersPath);
        if (controllerDirs.length > 0) {
          entryPoints["api-controllers"] = controllerDirs[0];
        }
      } catch (e) {
        // Ignore
      }
    }

    if (Object.keys(entryPoints).length > 0) {
      meta.structure.entryPoints = entryPoints;
    }
  }
}

// ============================================================================
// Context Analyzer - Analyzes Mission/Todo descriptions and finds related files
// ============================================================================

interface AnalysisResult {
  keywords: string[];
  relatedModules: string[];
  relatedFiles: string[];
  suggestedScope: "frontend" | "backend" | "fullstack" | "infra" | "docs" | "unknown";
  suggestedApproach?: string;
  techStackMatch: string[];
  complexity: "low" | "medium" | "high";
  analyzedAt: string;
}

interface KeywordPattern {
  keywords: string[];
  scope: "frontend" | "backend" | "fullstack" | "infra" | "docs";
  filePatterns: string[];
  directories: string[];
}

const KEYWORD_PATTERNS: KeywordPattern[] = [
  // Frontend
  {
    keywords: ["ui", "화면", "버튼", "컴포넌트", "component", "페이지", "page", "레이아웃", "layout", "스타일", "css", "tailwind", "디자인"],
    scope: "frontend",
    filePatterns: ["*.tsx", "*.jsx", "*.vue", "*.css", "*.scss"],
    directories: ["components", "pages", "views", "layouts", "styles"],
  },
  {
    keywords: ["react", "리액트", "훅", "hook", "상태", "state", "zustand", "redux", "context"],
    scope: "frontend",
    filePatterns: ["*.tsx", "*.jsx", "use*.ts"],
    directories: ["hooks", "stores", "contexts", "components"],
  },
  // Backend
  {
    keywords: ["api", "엔드포인트", "endpoint", "rest", "controller", "컨트롤러", "서버", "server"],
    scope: "backend",
    filePatterns: ["*Controller.java", "*Controller.kt", "*.controller.ts"],
    directories: ["controller", "controllers", "api", "routes"],
  },
  {
    keywords: ["데이터베이스", "database", "db", "쿼리", "query", "repository", "레포지토리", "엔티티", "entity", "jpa"],
    scope: "backend",
    filePatterns: ["*Repository.java", "*Entity.java", "*.entity.ts", "*.repository.ts"],
    directories: ["repository", "repositories", "domain", "entities", "models"],
  },
  {
    keywords: ["서비스", "service", "비즈니스", "business", "로직", "logic"],
    scope: "backend",
    filePatterns: ["*Service.java", "*Service.kt", "*.service.ts"],
    directories: ["service", "services"],
  },
  {
    keywords: ["인증", "auth", "로그인", "login", "jwt", "토큰", "token", "oauth", "보안", "security"],
    scope: "backend",
    filePatterns: ["*Auth*.java", "*Security*.java", "auth*.ts"],
    directories: ["auth", "security", "authentication"],
  },
  {
    keywords: ["websocket", "웹소켓", "실시간", "realtime", "socket", "stomp"],
    scope: "backend",
    filePatterns: ["*WebSocket*.java", "*Socket*.ts", "*Stomp*.java"],
    directories: ["websocket", "socket", "realtime"],
  },
  // Fullstack
  {
    keywords: ["전체", "통합", "풀스택", "fullstack", "end-to-end", "e2e"],
    scope: "fullstack",
    filePatterns: ["*"],
    directories: [],
  },
  // Infra
  {
    keywords: ["배포", "deploy", "docker", "kubernetes", "k8s", "ci", "cd", "pipeline", "aws", "인프라", "infra"],
    scope: "infra",
    filePatterns: ["Dockerfile", "docker-compose*.yml", "*.yaml", "*.sh"],
    directories: ["deploy", "infra", "docker", ".github"],
  },
  // Docs
  {
    keywords: ["문서", "doc", "readme", "가이드", "guide", "api문서", "swagger"],
    scope: "docs",
    filePatterns: ["*.md", "*.mdx", "openapi.yaml"],
    directories: ["docs", "documentation"],
  },
];

class ContextAnalyzer {
  private projectPath: string;
  private projectMeta: ProjectMeta | null;

  constructor(projectPath: string, projectMeta?: ProjectMeta) {
    this.projectPath = projectPath;
    this.projectMeta = projectMeta || null;
  }

  async analyzeDescription(
    description: string,
    title?: string
  ): Promise<AnalysisResult> {
    const text = `${title || ""} ${description}`.toLowerCase();

    // 1. Extract keywords
    const keywords = this.extractKeywords(text);

    // 2. Determine scope
    const scopeMatch = this.determineScope(text, keywords);

    // 3. Find related modules (from project meta)
    const relatedModules = this.findRelatedModules(keywords, scopeMatch.scope);

    // 4. Find related files
    const relatedFiles = await this.findRelatedFiles(keywords, scopeMatch);

    // 5. Match tech stack
    const techStackMatch = this.matchTechStack(keywords);

    // 6. Estimate complexity
    const complexity = this.estimateComplexity(text, relatedFiles.length);

    // 7. Generate suggested approach
    const suggestedApproach = this.generateApproach(scopeMatch.scope, keywords, relatedModules);

    return {
      keywords,
      relatedModules,
      relatedFiles: relatedFiles.slice(0, 15), // Limit to 15 files
      suggestedScope: scopeMatch.scope,
      suggestedApproach,
      techStackMatch,
      complexity,
      analyzedAt: new Date().toISOString(),
    };
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const allKeywords = KEYWORD_PATTERNS.flatMap((p) => p.keywords);

    for (const keyword of allKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    // Extract potential class/component names (PascalCase or camelCase)
    const nameMatches = text.match(/[A-Z][a-zA-Z]+|[a-z]+[A-Z][a-zA-Z]*/g) || [];
    for (const name of nameMatches) {
      if (name.length > 3 && !keywords.includes(name.toLowerCase())) {
        keywords.push(name);
      }
    }

    return [...new Set(keywords)];
  }

  private determineScope(
    text: string,
    keywords: string[]
  ): { scope: AnalysisResult["suggestedScope"]; patterns: KeywordPattern[] } {
    const scopeScores: Record<string, number> = {
      frontend: 0,
      backend: 0,
      fullstack: 0,
      infra: 0,
      docs: 0,
    };

    const matchedPatterns: KeywordPattern[] = [];

    for (const pattern of KEYWORD_PATTERNS) {
      let matchCount = 0;
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        scopeScores[pattern.scope] += matchCount;
        matchedPatterns.push(pattern);
      }
    }

    // Find highest scoring scope
    let maxScope: AnalysisResult["suggestedScope"] = "unknown";
    let maxScore = 0;

    for (const [scope, score] of Object.entries(scopeScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxScope = scope as AnalysisResult["suggestedScope"];
      }
    }

    // If both frontend and backend have significant scores, it's fullstack
    if (scopeScores.frontend >= 2 && scopeScores.backend >= 2) {
      maxScope = "fullstack";
    }

    return { scope: maxScope, patterns: matchedPatterns };
  }

  private findRelatedModules(keywords: string[], scope: string): string[] {
    if (!this.projectMeta?.project.modules) return [];

    const modules: string[] = [];

    for (const module of this.projectMeta.project.modules) {
      const moduleLower = module.toLowerCase();

      // Check if module name matches scope
      if (scope === "frontend" && (moduleLower.includes("web") || moduleLower.includes("client") || moduleLower.includes("ui"))) {
        modules.push(module);
      } else if (scope === "backend" && (moduleLower.includes("server") || moduleLower.includes("api") || moduleLower.includes("service"))) {
        modules.push(module);
      } else if (scope === "infra" && (moduleLower.includes("deploy") || moduleLower.includes("infra"))) {
        modules.push(module);
      }

      // Check if module name matches any keyword
      for (const keyword of keywords) {
        if (moduleLower.includes(keyword.toLowerCase())) {
          if (!modules.includes(module)) {
            modules.push(module);
          }
        }
      }
    }

    return modules;
  }

  private async findRelatedFiles(
    keywords: string[],
    scopeMatch: { scope: string; patterns: KeywordPattern[] }
  ): Promise<string[]> {
    const files: string[] = [];

    try {
      // Get directories to search
      const searchDirs: string[] = [];
      for (const pattern of scopeMatch.patterns) {
        searchDirs.push(...pattern.directories);
      }

      // If we have related modules, search within them
      const modules = this.projectMeta?.project.modules || [];
      const baseDirs = modules.length > 0 ? modules : ["."];

      for (const baseDir of baseDirs) {
        const basePath = path.join(this.projectPath, baseDir);
        if (!fs.existsSync(basePath)) continue;

        // Search for files matching patterns
        for (const pattern of scopeMatch.patterns) {
          for (const dir of pattern.directories) {
            const searchPath = path.join(basePath, "src", dir);
            if (fs.existsSync(searchPath)) {
              const found = this.searchDirectory(searchPath, pattern.filePatterns, keywords);
              files.push(...found.map((f) => f.replace(this.projectPath + "/", "")));
            }

            // Also check without src
            const altSearchPath = path.join(basePath, dir);
            if (fs.existsSync(altSearchPath) && altSearchPath !== searchPath) {
              const found = this.searchDirectory(altSearchPath, pattern.filePatterns, keywords);
              files.push(...found.map((f) => f.replace(this.projectPath + "/", "")));
            }
          }
        }

        // Search for files containing keywords
        for (const keyword of keywords) {
          if (keyword.length < 4) continue; // Skip short keywords

          try {
            // Use grep to find files containing the keyword
            const grepResult = execSync(
              `grep -rl --include="*.java" --include="*.ts" --include="*.tsx" --include="*.kt" "${keyword}" "${basePath}" 2>/dev/null | head -10`,
              { encoding: "utf-8", timeout: 5000 }
            );
            const grepFiles = grepResult.trim().split("\n").filter(Boolean);
            files.push(...grepFiles.map((f) => f.replace(this.projectPath + "/", "")));
          } catch {
            // Grep failed or timed out, ignore
          }
        }
      }
    } catch (e) {
      console.error("Error finding related files:", e);
    }

    // Remove duplicates and limit
    return [...new Set(files)].slice(0, 20);
  }

  private searchDirectory(dir: string, patterns: string[], keywords: string[]): string[] {
    const results: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectories (limit depth)
          if (!entry.name.startsWith(".") && !entry.name.includes("node_modules")) {
            results.push(...this.searchDirectory(fullPath, patterns, keywords));
          }
        } else if (entry.isFile()) {
          // Check if file matches patterns
          for (const pattern of patterns) {
            if (this.matchPattern(entry.name, pattern)) {
              results.push(fullPath);
              break;
            }
          }

          // Check if filename contains keyword
          for (const keyword of keywords) {
            if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
              if (!results.includes(fullPath)) {
                results.push(fullPath);
              }
              break;
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return results;
  }

  private matchPattern(filename: string, pattern: string): boolean {
    if (pattern === "*") return true;
    if (pattern.startsWith("*") && pattern.endsWith("*")) {
      return filename.includes(pattern.slice(1, -1));
    }
    if (pattern.startsWith("*")) {
      return filename.endsWith(pattern.slice(1));
    }
    if (pattern.endsWith("*")) {
      return filename.startsWith(pattern.slice(0, -1));
    }
    return filename === pattern;
  }

  private matchTechStack(keywords: string[]): string[] {
    if (!this.projectMeta?.stack) return [];

    const matches: string[] = [];

    // Match languages
    for (const lang of this.projectMeta.stack.languages || []) {
      if (keywords.some((k) => k.toLowerCase().includes(lang.toLowerCase()))) {
        matches.push(lang);
      }
    }

    // Match frameworks
    for (const fw of this.projectMeta.stack.frameworks || []) {
      if (keywords.some((k) => k.toLowerCase().includes(fw.toLowerCase().replace("-", "")))) {
        matches.push(fw);
      }
    }

    // Add frameworks based on scope
    const scopeMatch = this.determineScope(keywords.join(" "), keywords);
    if (scopeMatch.scope === "frontend" && this.projectMeta.stack.frameworks?.includes("react")) {
      if (!matches.includes("react")) matches.push("react");
    }
    if (scopeMatch.scope === "backend" && this.projectMeta.stack.frameworks?.includes("spring-boot")) {
      if (!matches.includes("spring-boot")) matches.push("spring-boot");
    }

    return matches;
  }

  private estimateComplexity(text: string, fileCount: number): "low" | "medium" | "high" {
    // High complexity indicators
    const highIndicators = ["리팩토링", "refactor", "마이그레이션", "migration", "아키텍처", "architecture", "전체", "시스템"];
    const mediumIndicators = ["구현", "implement", "추가", "add", "개선", "improve", "수정", "fix"];

    for (const indicator of highIndicators) {
      if (text.includes(indicator)) return "high";
    }

    if (fileCount > 10) return "high";
    if (fileCount > 5) return "medium";

    for (const indicator of mediumIndicators) {
      if (text.includes(indicator)) return "medium";
    }

    return "low";
  }

  private generateApproach(scope: string, keywords: string[], modules: string[]): string {
    const parts: string[] = [];

    if (modules.length > 0) {
      parts.push(`${modules.join(", ")} 모듈에서 작업`);
    }

    switch (scope) {
      case "frontend":
        parts.push("React 컴포넌트 및 상태 관리 수정");
        break;
      case "backend":
        parts.push("Spring Boot 서비스/컨트롤러 수정");
        break;
      case "fullstack":
        parts.push("프론트엔드와 백엔드 동시 수정 필요");
        break;
      case "infra":
        parts.push("배포 설정 및 인프라 구성 변경");
        break;
      case "docs":
        parts.push("문서 작성 및 업데이트");
        break;
    }

    if (keywords.includes("websocket") || keywords.includes("실시간")) {
      parts.push("WebSocket 연동 확인 필요");
    }

    if (keywords.includes("auth") || keywords.includes("인증")) {
      parts.push("인증/보안 관련 테스트 필수");
    }

    return parts.join(". ");
  }
}

// ThreadCast API Configuration
const API_BASE_URL = process.env.THREADCAST_API_URL || "http://localhost:21000/api";
const DEFAULT_WORKSPACE_ID: string | null = process.env.THREADCAST_WORKSPACE_ID || null;
const AUTH_EMAIL = process.env.THREADCAST_EMAIL || "test@threadcast.io";
const AUTH_PASSWORD = process.env.THREADCAST_PASSWORD || "test1234";
const AUTH_TOKEN = process.env.THREADCAST_TOKEN || ""; // Direct token for OAuth users

/**
 * 워크스페이스 ID를 가져옵니다.
 * 파라미터로 전달되지 않고 환경변수도 설정되지 않은 경우 명확한 에러를 반환합니다.
 */
function getWorkspaceId(providedId?: string | null): string {
  const workspaceId = providedId || DEFAULT_WORKSPACE_ID;
  if (!workspaceId) {
    throw new Error(
      "워크스페이스 ID가 필요합니다.\n" +
      "다음 중 하나를 수행하세요:\n" +
      "1. workspaceId 파라미터를 전달\n" +
      "2. THREADCAST_WORKSPACE_ID 환경변수 설정\n\n" +
      "워크스페이스 목록은 threadcast_list_workspaces로 확인할 수 있습니다."
    );
  }
  return workspaceId;
}

// API Client
class ThreadCastClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.client.post("/auth/login", { email, password });
    this.setToken(res.data.data.accessToken);
    return res.data.data;
  }

  async register(email: string, password: string, name: string) {
    const res = await this.client.post("/auth/register", { email, password, name });
    this.setToken(res.data.data.accessToken);
    return res.data.data;
  }

  async autoLogin(): Promise<boolean> {
    // If direct token is provided (for OAuth users), use it
    if (AUTH_TOKEN) {
      this.setToken(AUTH_TOKEN);
      console.error("ThreadCast: Using direct token authentication");
      return true;
    }

    try {
      // Try login first
      await this.login(AUTH_EMAIL, AUTH_PASSWORD);
      return true;
    } catch {
      try {
        // If login fails, try register
        await this.register(AUTH_EMAIL, AUTH_PASSWORD, "ThreadCast User");
        return true;
      } catch (e) {
        console.error("Auto-login failed:", e);
        return false;
      }
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Workspaces
  async listWorkspaces() {
    const res = await this.client.get("/workspaces");
    return res.data.data;
  }

  async getWorkspace(id: string) {
    const res = await this.client.get(`/workspaces/${id}`);
    return res.data.data;
  }

  async createWorkspace(name: string, path: string, description?: string) {
    const res = await this.client.post("/workspaces", { name, path, description });
    return res.data.data;
  }

  async deleteWorkspace(id: string) {
    const res = await this.client.delete(`/workspaces/${id}`);
    return res.data.data;
  }

  // Missions
  async listMissions(workspaceId: string, status?: string) {
    const params: Record<string, string> = { workspaceId };
    if (status) params.status = status;
    const res = await this.client.get("/missions", { params });
    return res.data.data;
  }

  async getMission(id: string) {
    const res = await this.client.get(`/missions/${id}`);
    return res.data.data;
  }

  async createMission(workspaceId: string, title: string, description?: string, priority: string = "MEDIUM") {
    const res = await this.client.post("/missions", {
      workspaceId,
      title,
      description,
      priority,
    });
    return res.data.data;
  }

  async updateMissionStatus(id: string, status: string) {
    const res = await this.client.patch(`/missions/${id}/status`, { status });
    return res.data.data;
  }

  async updateMission(id: string, updates: { title?: string; description?: string; priority?: string }) {
    const res = await this.client.patch(`/missions/${id}`, updates);
    return res.data.data;
  }

  async deleteMission(id: string) {
    const res = await this.client.delete(`/missions/${id}`);
    return res.data.data;
  }

  async startWeaving(id: string) {
    const res = await this.client.post(`/missions/${id}/start-weaving`);
    return res.data.data;
  }

  async analyzeMission(id: string) {
    const res = await this.client.post(`/missions/${id}/analyze`);
    return res.data.data;
  }

  // Todos
  async listTodos(missionId?: string) {
    const params: Record<string, string> = {};
    if (missionId) params.missionId = missionId;
    const res = await this.client.get("/todos", { params });
    return res.data.data;
  }

  async getTodo(id: string) {
    const res = await this.client.get(`/todos/${id}`);
    return res.data.data;
  }

  async createTodo(
    missionId: string,
    title: string,
    description?: string,
    complexity: string = "MEDIUM",
    estimatedTime?: number
  ) {
    const res = await this.client.post("/todos", {
      missionId,
      title,
      description,
      complexity,
      estimatedTime,
    });
    return res.data.data;
  }

  async deleteTodo(id: string) {
    const res = await this.client.delete(`/todos/${id}`);
    return res.data.data;
  }

  async updateTodoStatus(id: string, status: string) {
    const res = await this.client.patch(`/todos/${id}/status`, { status });
    return res.data.data;
  }

  async updateStepStatus(todoId: string, stepType: string, status: string) {
    const res = await this.client.patch(`/todos/${todoId}/steps/${stepType}`, { status });
    return res.data.data;
  }

  // AI Questions
  async listAIQuestions(workspaceId?: string) {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const res = await this.client.get("/ai-questions", { params });
    return res.data.data || [];
  }

  async answerQuestion(questionId: string, answer: string) {
    const res = await this.client.post(`/ai-questions/${questionId}/answer`, { answer });
    return res.data.data;
  }

  async skipQuestion(questionId: string) {
    const res = await this.client.post(`/ai-questions/${questionId}/skip`);
    return res.data.data;
  }

  async createAIQuestion(
    todoId: string,
    question: string,
    category: string = "CLARIFICATION",
    options?: string[]
  ) {
    const res = await this.client.post("/ai-questions", {
      todoId,
      question,
      category,
      options,
    });
    return res.data.data;
  }

  // Workspace Settings
  async getWorkspaceSettings(workspaceId: string) {
    const res = await this.client.get(`/workspaces/${workspaceId}/settings`);
    return res.data.data;
  }

  // Todo Dependencies
  async updateTodoDependencies(todoId: string, dependencies: string[]) {
    const res = await this.client.patch(`/todos/${todoId}/dependencies`, { dependencies });
    return res.data.data;
  }

  async getReadyTodos(missionId: string) {
    const res = await this.client.get("/todos/ready", { params: { missionId } });
    return res.data.data;
  }

  // Timeline
  async getTimeline(workspaceId: string, limit: number = 20) {
    const res = await this.client.get("/timeline", {
      params: { workspaceId, size: limit },
    });
    return res.data.data?.content || res.data.data || [];
  }

  // Hub (Start Worker)
  async startWorker(todoId: string) {
    const res = await this.client.post(`/hub/todos/${todoId}/start-worker`);
    return res.data.data;
  }

  async stopWorker(todoId: string) {
    const res = await this.client.post(`/hub/todos/${todoId}/stop-worker`);
    return res.data.data;
  }

  // Meta API
  async getTodoMeta(todoId: string) {
    const res = await this.client.get(`/todos/${todoId}/meta`);
    return res.data.data;
  }

  async getTodoEffectiveMeta(todoId: string) {
    const res = await this.client.get(`/todos/${todoId}/effective-meta`);
    return res.data.data;
  }

  async updateTodoMeta(todoId: string, meta: Record<string, unknown>, merge: boolean = true) {
    const res = await this.client.patch(`/todos/${todoId}/meta`, { meta, merge });
    return res.data.data;
  }

  async getMissionMeta(missionId: string) {
    const res = await this.client.get(`/missions/${missionId}/meta`);
    return res.data.data;
  }

  async getMissionEffectiveMeta(missionId: string) {
    const res = await this.client.get(`/missions/${missionId}/effective-meta`);
    return res.data.data;
  }

  async updateMissionMeta(missionId: string, meta: Record<string, unknown>, merge: boolean = true) {
    const res = await this.client.patch(`/missions/${missionId}/meta`, { meta, merge });
    return res.data.data;
  }

  async getWorkspaceMeta(workspaceId: string) {
    const res = await this.client.get(`/workspaces/${workspaceId}/meta`);
    return res.data.data;
  }

  async updateWorkspaceMeta(workspaceId: string, meta: Record<string, unknown>, merge: boolean = true) {
    const res = await this.client.patch(`/workspaces/${workspaceId}/meta`, { meta, merge });
    return res.data.data;
  }

  // Session Context - aggregates current work state for context recovery
  async getSessionContext(workspaceId: string): Promise<{
    workspace: { id: string; name: string; path?: string; projectContext?: Record<string, unknown> };
    currentMission?: { id: string; title: string; status: string; progress: number; description?: string };
    currentTodo?: { id: string; title: string; status: string; currentStep?: string; recentProgress: string[] };
    recentActivity: string[];
    summary: string;
  }> {
    // 1. Get workspace info and meta (use listWorkspaces as fallback if getWorkspace fails)
    let workspace: { id: string; name: string; path?: string };
    try {
      workspace = await this.getWorkspace(workspaceId);
    } catch {
      // Fallback: find workspace from list
      const workspaces = await this.listWorkspaces();
      const found = workspaces.find((w: { id: string }) => w.id === workspaceId);
      if (!found) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }
      workspace = found;
    }
    const workspaceMeta = await this.getWorkspaceMeta(workspaceId);

    // 2. Find current active mission (THREADING status)
    const missionsRes = await this.client.get(`/missions?workspaceId=${workspaceId}&status=THREADING&page=0&size=1`);
    const missions = missionsRes.data.data?.content || [];
    let currentMission = missions[0] || null;

    // If no THREADING mission, check for most recent BACKLOG
    if (!currentMission) {
      const backlogRes = await this.client.get(`/missions?workspaceId=${workspaceId}&status=BACKLOG&page=0&size=1`);
      const backlogMissions = backlogRes.data.data?.content || [];
      currentMission = backlogMissions[0] || null;
    }

    // 3. Find current active todo (THREADING status)
    let currentTodo = null;
    let recentProgress: string[] = [];

    if (currentMission) {
      const todosRes = await this.client.get(`/todos?missionId=${currentMission.id}`);
      const todos = todosRes.data.data || [];

      // Find THREADING todo
      currentTodo = todos.find((t: { status: string }) => t.status === "THREADING") || null;

      // If no THREADING, find most recent one
      if (!currentTodo && todos.length > 0) {
        currentTodo = todos[0];
      }

      // Get todo meta for progress info
      if (currentTodo) {
        try {
          const todoMeta = await this.getTodoMeta(currentTodo.id);
          const steps = todoMeta?.steps || {};

          // Extract progress from completed steps
          for (const [stepName, stepData] of Object.entries(steps)) {
            const data = stepData as { status?: string; result?: { summary?: string } };
            if (data.status === "COMPLETED" && data.result?.summary) {
              recentProgress.push(`${stepName}: ${data.result.summary}`);
            }
          }
        } catch {
          // Ignore meta fetch errors
        }
      }
    }

    // 4. Get recent timeline events
    const recentActivity: string[] = [];
    try {
      const timelineRes = await this.client.get(`/timeline?workspaceId=${workspaceId}&limit=5`);
      const events = timelineRes.data.data || [];
      for (const event of events) {
        const timeAgo = this.getTimeAgo(new Date(event.createdAt));
        recentActivity.push(`${event.eventType}: ${event.title || event.description || ''} - ${timeAgo}`);
      }
    } catch {
      // Timeline might not be available
    }

    // 5. Generate summary
    let summary = "";
    if (currentMission && currentTodo) {
      const stepInfo = currentTodo.currentStep ? `, 현재 단계: ${currentTodo.currentStep}` : "";
      summary = `미션 "${currentMission.title}" 진행 중 (${currentMission.progress}%). ` +
        `현재 Todo: "${currentTodo.title}" (${currentTodo.status}${stepInfo}).`;
      if (recentProgress.length > 0) {
        summary += ` 최근 진행: ${recentProgress[recentProgress.length - 1]}`;
      }
    } else if (currentMission) {
      summary = `미션 "${currentMission.title}" 대기 중. Todo 작업을 시작하세요.`;
    } else {
      summary = "진행 중인 미션이 없습니다. 새 미션을 생성하거나 기존 미션을 시작하세요.";
    }

    return {
      workspace: {
        id: workspaceId,
        name: workspace.name,
        path: workspace.path,
        projectContext: workspaceMeta?.projectContext,
      },
      currentMission: currentMission ? {
        id: currentMission.id,
        title: currentMission.title,
        status: currentMission.status,
        progress: currentMission.progress,
        description: currentMission.description,
      } : undefined,
      currentTodo: currentTodo ? {
        id: currentTodo.id,
        title: currentTodo.title,
        status: currentTodo.status,
        currentStep: currentTodo.currentStep,
        recentProgress,
      } : undefined,
      recentActivity,
      summary,
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  }

  // AI Mission Generation
  async generateMissionFromPrompt(prompt: string): Promise<GeneratedMission> {
    const lowerPrompt = prompt.toLowerCase();

    // Find matching template
    const matchedTemplate = MISSION_TEMPLATES.find((template) =>
      template.keywords.some((keyword) => lowerPrompt.includes(keyword.toLowerCase()))
    );

    // If template found, use it
    if (matchedTemplate) {
      return {
        title: matchedTemplate.title,
        description: matchedTemplate.description,
        priority: matchedTemplate.priority,
        suggestedTodos: matchedTemplate.todos,
      };
    }

    // No template matched - use default template
    // Note: AI question generation is handled by PM Agent (Claude Code), not here
    const title = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
    const description = `## 목표\n${prompt}\n\n## 요구사항\n- 상세 요구사항 분석 필요\n- 설계 및 구현\n- 테스트 및 검증`;

    return {
      title,
      description,
      priority: "MEDIUM",
      suggestedTodos: DEFAULT_MISSION_TEMPLATE.todos,
    };
  }

  async createMissionWithTodos(
    workspaceId: string,
    mission: GeneratedMission,
    createQuestionsForUncertain: boolean = true
  ): Promise<{ mission: unknown; todos: unknown[]; questions: unknown[] }> {
    // Create the mission
    const createdMission = await this.createMission(
      workspaceId,
      mission.title,
      mission.description,
      mission.priority
    );

    // Create todos
    const createdTodos: unknown[] = [];
    const createdQuestions: unknown[] = [];

    for (const todo of mission.suggestedTodos) {
      const created = await this.createTodo(
        createdMission.id,
        todo.title,
        todo.description,
        todo.complexity,
        todo.estimatedTime
      );
      createdTodos.push(created);

      // Check if this todo has uncertainty and create AI question
      if (createQuestionsForUncertain && todo.isUncertain && todo.uncertainQuestion) {
        try {
          const question = await this.createAIQuestion(
            (created as { id: string }).id,
            todo.uncertainQuestion,
            "DESIGN_DECISION",
            todo.uncertainOptions
          );
          createdQuestions.push(question);
        } catch (e) {
          console.error("Failed to create AI question:", e);
        }
      }
    }

    return { mission: createdMission, todos: createdTodos, questions: createdQuestions };
  }

  // ==================== JIRA Integration ====================

  /**
   * Get JIRA connection status for a workspace
   */
  async getJiraStatus(workspaceId: string) {
    const res = await this.client.get(`/jira/status`, { params: { workspaceId } });
    return res.data.data;
  }

  /**
   * Connect to JIRA with API Token or PAT
   */
  async connectJira(
    workspaceId: string,
    instanceType: string,
    baseUrl: string,
    authType: string,
    apiToken?: string,
    email?: string,
    defaultProjectKey?: string
  ) {
    const res = await this.client.post("/jira/connect", {
      workspaceId,
      instanceType,
      baseUrl,
      authType,
      apiToken,
      email,
      defaultProjectKey,
    });
    return res.data.data;
  }

  /**
   * Disconnect JIRA integration
   */
  async disconnectJira(workspaceId: string) {
    const res = await this.client.delete("/jira/disconnect", { params: { workspaceId } });
    return res.data.data;
  }

  /**
   * Get JIRA projects
   */
  async getJiraProjects(workspaceId: string) {
    const res = await this.client.get("/jira/projects", { params: { workspaceId } });
    return res.data.data;
  }

  /**
   * Search JIRA issues with JQL
   */
  async searchJiraIssues(workspaceId: string, jql: string, maxResults: number = 50) {
    const res = await this.client.get("/jira/issues/search", {
      params: { workspaceId, jql, maxResults },
    });
    return res.data.data;
  }

  /**
   * Get single JIRA issue
   */
  async getJiraIssue(workspaceId: string, issueKey: string) {
    const res = await this.client.get(`/jira/issues/${issueKey}`, { params: { workspaceId } });
    return res.data.data;
  }

  /**
   * Import a single JIRA issue as Mission or Todo
   */
  async importJiraIssue(
    workspaceId: string,
    issueKey: string,
    targetType: "MISSION" | "TODO",
    missionId?: string,
    orderIndex?: number
  ) {
    const res = await this.client.post("/jira/import/issue", {
      workspaceId,
      issueKey,
      targetType,
      missionId,
      orderIndex,
    });
    return res.data.data;
  }

  /**
   * Import a JIRA Epic as Mission with child issues as Todos
   */
  async importJiraEpic(
    workspaceId: string,
    epicKey: string,
    includeChildren: boolean = true,
    issueTypes?: string[],
    includeCompleted: boolean = false
  ) {
    const res = await this.client.post("/jira/import/epic", {
      workspaceId,
      epicKey,
      includeChildren,
      issueTypes,
      includeCompleted,
    });
    return res.data.data;
  }

  /**
   * Get JIRA issue mappings for a workspace
   */
  async getJiraMappings(workspaceId: string) {
    const res = await this.client.get("/jira/mappings", { params: { workspaceId } });
    return res.data.data;
  }

  /**
   * Unlink a JIRA mapping (remove without deleting the Mission/Todo)
   */
  async unlinkJiraMapping(mappingId: string) {
    const res = await this.client.delete(`/jira/mappings/${mappingId}`);
    return res.data.data;
  }

  // ==================== PM Agent ====================

  /**
   * Register PM Agent with workspace
   */
  async registerPmAgent(
    workspaceId: string,
    machineId: string,
    label?: string,
    agentVersion?: string
  ) {
    const res = await this.client.post("/pm-agent/register", {
      workspaceId,
      machineId,
      label,
      agentVersion,
    });
    return res.data.data;
  }

  /**
   * Disconnect PM Agent from workspace
   */
  async disconnectPmAgent(workspaceId: string) {
    const res = await this.client.post("/pm-agent/disconnect", null, {
      params: { workspaceId },
    });
    return res.data.data;
  }

  /**
   * Send PM Agent heartbeat
   */
  async pmAgentHeartbeat(
    workspaceId: string,
    currentTodoId?: string,
    currentTodoTitle?: string,
    activeTodoCount?: number
  ) {
    const res = await this.client.post(
      "/pm-agent/heartbeat",
      {
        currentTodoId,
        currentTodoTitle,
        activeTodoCount,
      },
      { params: { workspaceId } }
    );
    return res.data.data;
  }

  /**
   * Get PM Agent status for workspace
   */
  async getPmAgentStatus(workspaceId: string) {
    const res = await this.client.get("/pm-agent/status", {
      params: { workspaceId },
    });
    return res.data.data;
  }
}

// AI Mission Generation Types and Templates
interface GeneratedMission {
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  suggestedTodos: Array<{
    title: string;
    description: string;
    complexity: "LOW" | "MEDIUM" | "HIGH";
    estimatedTime: number;
    dependsOn?: number[];
    isUncertain?: boolean;
    uncertainQuestion?: string;
    uncertainOptions?: string[];
  }>;
}

interface MissionTemplate {
  keywords: string[];
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  todos: Array<{
    title: string;
    description: string;
    complexity: "LOW" | "MEDIUM" | "HIGH";
    estimatedTime: number;
    dependsOn?: number[];
    isUncertain?: boolean;
    uncertainQuestion?: string;
    uncertainOptions?: string[];
  }>;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    keywords: ["다크모드", "dark mode", "다크 모드", "테마"],
    title: "다크모드 테마 시스템 구현",
    description:
      "## 목표\n앱 전체에 다크모드 지원 추가\n\n## 요구사항\n- 시스템 설정 자동 감지\n- 수동 토글 기능\n- 설정 로컬 저장\n- 부드러운 전환 애니메이션",
    priority: "MEDIUM",
    todos: [
      {
        title: "CSS 변수 기반 테마 시스템 설계",
        description: "color, background, border 등 테마 변수 정의",
        complexity: "LOW",
        estimatedTime: 30,
        isUncertain: true,
        uncertainQuestion: "테마 색상 팔레트를 어떻게 구성할까요?",
        uncertainOptions: ["Material Design 팔레트 사용", "Tailwind 기본 색상 사용", "커스텀 브랜드 색상 정의", "기존 디자인 시스템 따르기"],
      },
      {
        title: "ThemeProvider 컨텍스트 구현",
        description: "React Context로 테마 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "테마 토글 컴포넌트",
        description: "라이트/다크 모드 전환 버튼 UI",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "시스템 설정 연동",
        description: "prefers-color-scheme 미디어 쿼리 감지",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "전체 컴포넌트 테마 적용",
        description: "모든 UI 컴포넌트에 테마 변수 적용",
        complexity: "HIGH",
        estimatedTime: 120,
        dependsOn: [0, 1],
      },
    ],
  },
  {
    keywords: ["알림", "notification", "푸시", "push"],
    title: "실시간 알림 시스템 구현",
    description:
      "## 목표\n사용자에게 실시간 알림 제공\n\n## 요구사항\n- 인앱 토스트 알림\n- 알림 센터 UI\n- 읽음/안읽음 상태 관리\n- 알림 설정 페이지",
    priority: "HIGH",
    todos: [
      {
        title: "WebSocket 연결 설정",
        description: "STOMP 프로토콜 기반 실시간 연결",
        complexity: "MEDIUM",
        estimatedTime: 60,
        isUncertain: true,
        uncertainQuestion: "WebSocket 라이브러리를 어떤 것을 사용할까요?",
        uncertainOptions: ["STOMP.js (현재 프로젝트 표준)", "Socket.io", "Native WebSocket API", "SockJS + STOMP"],
      },
      {
        title: "알림 스토어 구현",
        description: "Zustand로 알림 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [0],
      },
      {
        title: "토스트 알림 컴포넌트",
        description: "화면 우상단 팝업 알림 UI",
        complexity: "LOW",
        estimatedTime: 30,
        isUncertain: true,
        uncertainQuestion: "토스트 알림의 표시 위치를 어디로 할까요?",
        uncertainOptions: ["우상단 (기본)", "우하단", "상단 중앙", "하단 중앙"],
      },
      {
        title: "알림 센터 드로어",
        description: "전체 알림 목록 사이드 패널",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [1],
      },
      {
        title: "알림 설정 페이지",
        description: "알림 유형별 on/off 설정",
        complexity: "LOW",
        estimatedTime: 45,
        dependsOn: [1],
      },
    ],
  },
  {
    keywords: ["검색", "search", "찾기"],
    title: "통합 검색 기능 구현",
    description:
      "## 목표\n전체 콘텐츠 통합 검색\n\n## 요구사항\n- Cmd+K 단축키 지원\n- 실시간 검색 결과\n- 검색 히스토리\n- 필터 및 정렬",
    priority: "MEDIUM",
    todos: [
      {
        title: "검색 API 엔드포인트 구현",
        description: "GET /api/search?q={query} 백엔드 API",
        complexity: "MEDIUM",
        estimatedTime: 60,
      },
      {
        title: "검색 모달 UI",
        description: "Cmd+K로 열리는 검색 다이얼로그",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "실시간 검색 결과 표시",
        description: "debounce 적용 실시간 검색",
        complexity: "LOW",
        estimatedTime: 30,
        dependsOn: [0, 1],
      },
      {
        title: "검색 히스토리 저장",
        description: "localStorage 기반 최근 검색어",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "검색 필터 구현",
        description: "타입별, 날짜별 필터링",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [0],
      },
    ],
  },
  {
    keywords: ["로그인", "인증", "auth", "login", "회원가입"],
    title: "사용자 인증 시스템 구현",
    description:
      "## 목표\n안전한 사용자 인증 시스템\n\n## 요구사항\n- 이메일/비밀번호 로그인\n- JWT 토큰 관리\n- 소셜 로그인 (선택)\n- 비밀번호 재설정",
    priority: "CRITICAL",
    todos: [
      {
        title: "로그인/회원가입 API",
        description: "POST /auth/login, /auth/register 구현",
        complexity: "MEDIUM",
        estimatedTime: 60,
      },
      {
        title: "JWT 토큰 관리",
        description: "액세스/리프레시 토큰 발급 및 갱신",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0],
        isUncertain: true,
        uncertainQuestion: "JWT 토큰 저장 방식을 어떻게 할까요?",
        uncertainOptions: ["localStorage (편리함, XSS 취약)", "httpOnly Cookie (보안 강화)", "메모리 + Refresh Token Cookie", "sessionStorage (탭 격리)"],
      },
      {
        title: "로그인 폼 UI",
        description: "이메일, 비밀번호 입력 폼",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "인증 상태 관리",
        description: "Zustand 스토어로 로그인 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [1],
      },
      {
        title: "소셜 로그인 연동",
        description: "OAuth 2.0 소셜 로그인 구현",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0],
        isUncertain: true,
        uncertainQuestion: "어떤 소셜 로그인을 지원할까요? (복수 선택 가능)",
        uncertainOptions: ["Google OAuth", "GitHub OAuth", "Kakao 로그인", "Naver 로그인", "Apple Sign-in"],
      },
      {
        title: "비밀번호 재설정",
        description: "이메일 기반 비밀번호 재설정 플로우",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
    ],
  },
  {
    keywords: ["대시보드", "dashboard", "통계", "차트"],
    title: "대시보드 페이지 구현",
    description:
      "## 목표\n핵심 지표를 한눈에 파악할 수 있는 대시보드\n\n## 요구사항\n- 주요 통계 카드\n- 차트 시각화\n- 최근 활동 타임라인\n- 반응형 레이아웃",
    priority: "MEDIUM",
    todos: [
      {
        title: "통계 API 구현",
        description: "GET /api/stats 백엔드 API",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "통계 카드 컴포넌트",
        description: "숫자와 트렌드 표시 카드",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "차트 컴포넌트",
        description: "Recharts 기반 라인/바 차트",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
      {
        title: "대시보드 레이아웃",
        description: "Grid 기반 반응형 레이아웃",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "실시간 데이터 갱신",
        description: "WebSocket으로 실시간 업데이트",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0, 2],
      },
    ],
  },
  {
    keywords: ["api", "rest", "endpoint", "백엔드", "backend"],
    title: "REST API 엔드포인트 구현",
    description:
      "## 목표\nRESTful API 설계 및 구현\n\n## 요구사항\n- CRUD 엔드포인트\n- 입력 유효성 검증\n- 에러 핸들링\n- API 문서화",
    priority: "HIGH",
    todos: [
      {
        title: "API 스펙 문서 작성",
        description: "OpenAPI/Swagger 스펙 작성",
        complexity: "LOW",
        estimatedTime: 60,
      },
      {
        title: "CRUD 엔드포인트 구현",
        description: "기본 CRUD 작업을 위한 REST API 구현",
        complexity: "MEDIUM",
        estimatedTime: 120,
      },
      {
        title: "에러 핸들링 구현",
        description: "표준화된 에러 응답 형식 및 예외 처리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [1],
      },
      {
        title: "입력 유효성 검증",
        description: "요청 데이터 검증 및 변환 로직",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [1],
      },
      {
        title: "API 테스트 작성",
        description: "통합 테스트 및 단위 테스트 작성",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [1, 2, 3],
      },
    ],
  },
  {
    keywords: ["리팩토링", "refactor", "개선", "cleanup", "정리"],
    title: "코드 리팩토링",
    description:
      "## 목표\n코드 품질 개선 및 유지보수성 향상\n\n## 요구사항\n- 코드 분석\n- 컴포넌트 분리\n- 공통 유틸리티 추출\n- 테스트 커버리지 확보",
    priority: "MEDIUM",
    todos: [
      {
        title: "코드 분석 및 문제점 파악",
        description: "현재 코드베이스의 문제점과 개선 포인트 분석",
        complexity: "LOW",
        estimatedTime: 60,
      },
      {
        title: "컴포넌트 분리",
        description: "대형 컴포넌트를 작은 단위로 분리",
        complexity: "MEDIUM",
        estimatedTime: 90,
        dependsOn: [0],
      },
      {
        title: "공통 유틸리티 추출",
        description: "반복되는 로직을 유틸리티 함수로 추출",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
      {
        title: "타입 정의 개선",
        description: "TypeScript 타입 정의 강화 및 정리",
        complexity: "LOW",
        estimatedTime: 45,
        dependsOn: [0],
      },
      {
        title: "테스트 커버리지 확보",
        description: "리팩토링된 코드에 대한 테스트 작성",
        complexity: "HIGH",
        estimatedTime: 120,
        dependsOn: [1, 2],
      },
    ],
  },
];

const DEFAULT_MISSION_TEMPLATE: MissionTemplate = {
  keywords: [],
  title: "새 기능 개발",
  description:
    "## 목표\n요청된 기능 구현\n\n## 요구사항\n- 요구사항 분석 필요\n- 설계 문서 작성\n- 구현 및 테스트",
  priority: "MEDIUM",
  todos: [
    {
      title: "요구사항 분석",
      description: "상세 요구사항 정리 및 범위 확정",
      complexity: "LOW",
      estimatedTime: 30,
    },
    {
      title: "기술 설계",
      description: "아키텍처 및 데이터 구조 설계",
      complexity: "MEDIUM",
      estimatedTime: 60,
    },
    {
      title: "핵심 기능 구현",
      description: "메인 로직 개발",
      complexity: "HIGH",
      estimatedTime: 120,
      dependsOn: [0, 1],
    },
    {
      title: "UI 구현",
      description: "사용자 인터페이스 개발",
      complexity: "MEDIUM",
      estimatedTime: 60,
      dependsOn: [1],
    },
    {
      title: "테스트 및 검증",
      description: "기능 테스트 및 버그 수정",
      complexity: "LOW",
      estimatedTime: 45,
      dependsOn: [2, 3],
    },
  ],
};

// ============================================
// Note: AI question generation is handled by PM Agent (Claude Code)
// The MCP provides basic tools, Claude Code analyzes prompts and generates questions
// ============================================

// MCP Server
const client = new ThreadCastClient();

const server = new Server(
  {
    name: "threadcast-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool Definitions
const tools = [
  // Auth
  {
    name: "threadcast_login",
    description: "Login to ThreadCast (usually auto-authenticated, use if needed)",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email address" },
        password: { type: "string", description: "Password" },
      },
      required: ["email", "password"],
    },
  },
  // Workspace
  {
    name: "threadcast_list_workspaces",
    description: "List all workspaces",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "threadcast_create_workspace",
    description: "Create a new workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Workspace name" },
        path: { type: "string", description: "Workspace path (e.g., ~/projects/myapp)" },
        description: { type: "string", description: "Workspace description" },
      },
      required: ["name", "path"],
    },
  },
  {
    name: "threadcast_delete_workspace",
    description: "Delete a workspace and all its missions/todos",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Workspace ID to delete" },
      },
      required: ["id"],
    },
  },
  // Mission
  {
    name: "threadcast_list_missions",
    description: "List missions in a workspace",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        status: { type: "string", enum: ["BACKLOG", "THREADING", "WOVEN", "ARCHIVED"], description: "Filter by status" },
      },
    },
  },
  {
    name: "threadcast_get_mission",
    description: "Get mission details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_create_mission",
    description: "Create a new mission",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Mission title" },
        description: { type: "string", description: "Mission description" },
        priority: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
      required: ["title"],
    },
  },
  {
    name: "threadcast_update_mission_status",
    description: "Update mission status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
        status: { type: "string", enum: ["BACKLOG", "THREADING", "WOVEN", "ARCHIVED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "threadcast_update_mission",
    description: "Update mission details (title, description, priority)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
        title: { type: "string", description: "New mission title" },
        description: { type: "string", description: "New mission description" },
        priority: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], description: "New priority" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_delete_mission",
    description: "Delete a mission and all its todos",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_start_weaving",
    description: "Start weaving a mission (begin AI work)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_analyze_mission",
    description: "Analyze a mission with AI and generate todo suggestions",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  // Todo
  {
    name: "threadcast_list_todos",
    description: "List todos (optionally filtered by mission)",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID to filter" },
      },
    },
  },
  {
    name: "threadcast_get_todo",
    description: "Get todo details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Todo ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_create_todo",
    description: "Create a new todo",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
        title: { type: "string", description: "Todo title" },
        description: { type: "string", description: "Todo description" },
        complexity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
        estimatedTime: { type: "number", description: "Estimated time in minutes" },
      },
      required: ["missionId", "title"],
    },
  },
  {
    name: "threadcast_delete_todo",
    description: "Delete a todo",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Todo ID to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_update_todo_status",
    description: "Update todo status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Todo ID" },
        status: { type: "string", enum: ["PENDING", "THREADING", "WOVEN", "TANGLED", "ARCHIVED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "threadcast_update_step_status",
    description: "Update a step status within a todo",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        stepType: { type: "string", enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"] },
        status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"] },
      },
      required: ["todoId", "stepType", "status"],
    },
  },
  {
    name: "threadcast_start_worker",
    description: "Start AI worker for a todo (launches Claude Code)",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_stop_worker",
    description: "Stop AI worker for a todo",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  // AI Questions
  {
    name: "threadcast_list_questions",
    description: "List pending AI questions",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional)" },
      },
    },
  },
  {
    name: "threadcast_answer_question",
    description: "Answer an AI question",
    inputSchema: {
      type: "object",
      properties: {
        questionId: { type: "string", description: "Question ID" },
        answer: { type: "string", description: "Your answer" },
      },
      required: ["questionId", "answer"],
    },
  },
  {
    name: "threadcast_skip_question",
    description: "Skip an AI question (let AI decide)",
    inputSchema: {
      type: "object",
      properties: {
        questionId: { type: "string", description: "Question ID" },
      },
      required: ["questionId"],
    },
  },
  {
    name: "threadcast_create_ai_question",
    description: "Create an AI question for user clarification. The question may be auto-resolved based on workspace Autonomy level: CRITICAL categories (RISK, SECURITY) always ask the user; IMPORTANT categories (DESIGN_DECISION, SCOPE) ask at medium or low autonomy; NORMAL categories only ask at low autonomy. If autonomy is too high for the category, the question is auto-resolved using the first option.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to associate the question with" },
        question: { type: "string", description: "The question text to ask the user" },
        category: {
          type: "string",
          enum: ["CLARIFICATION", "DESIGN_DECISION", "PRIORITY", "SCOPE", "TECHNICAL", "RISK", "SECURITY", "ARCHITECTURE"],
          description: "Question category. CRITICAL: RISK, SECURITY (always ask). IMPORTANT: ARCHITECTURE, DESIGN_DECISION, SCOPE (ask at medium/low autonomy). NORMAL: others (ask only at low autonomy).",
          default: "CLARIFICATION",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of predefined answer options. First option is used for auto-resolve when autonomy is high.",
        },
      },
      required: ["todoId", "question"],
    },
  },
  // Workspace Settings
  {
    name: "threadcast_get_workspace_settings",
    description: "Get workspace settings including Autonomy level (0-100). Low autonomy means AI should ask more questions, high autonomy means AI can make decisions independently.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
    },
  },
  // Todo Dependencies
  {
    name: "threadcast_update_dependencies",
    description: "Update todo dependencies. Set which todos must be completed before this todo can start.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to update" },
        dependencies: {
          type: "array",
          items: { type: "string" },
          description: "List of dependency Todo IDs",
        },
      },
      required: ["todoId", "dependencies"],
    },
  },
  {
    name: "threadcast_get_ready_todos",
    description: "Get todos that are ready to start (all dependencies completed)",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
      },
      required: ["missionId"],
    },
  },
  // Timeline
  {
    name: "threadcast_get_timeline",
    description: "Get recent timeline events",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        limit: { type: "number", description: "Number of events to fetch", default: 20 },
      },
    },
  },
  // AI Mission Generation
  {
    name: "threadcast_generate_mission_ai",
    description:
      "Generate a mission with todos from a natural language prompt using AI. " +
      "Returns a preview of the generated mission and todos. " +
      "Supports keywords: 다크모드/테마, 알림/notification, 검색/search, 로그인/인증, 대시보드/통계, api/백엔드, 리팩토링 등",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Natural language description of what you want to build (e.g., '다크모드 테마 추가', '실시간 알림 시스템')",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "threadcast_create_mission_ai",
    description:
      "Create a mission with todos from a natural language prompt using AI. " +
      "This will actually create the mission and todos in the workspace. " +
      "For uncertain items, AI questions will be automatically created for user clarification. " +
      "Use threadcast_generate_mission_ai first to preview what will be created.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Natural language description of what you want to build",
        },
        workspaceId: {
          type: "string",
          description: "Workspace ID (optional, uses default)",
        },
        createQuestions: {
          type: "boolean",
          description: "Whether to create AI questions for uncertain items (default: true)",
          default: true,
        },
      },
      required: ["prompt"],
    },
  },
  // Meta Management
  {
    name: "threadcast_get_todo_meta",
    description: "Get a todo's own meta (not inherited). Returns the meta object directly attached to this todo.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_get_todo_effective_meta",
    description:
      "Get a todo's effective meta (merged from Workspace → Mission → Todo). " +
      "This is the fully resolved meta with inheritance applied. " +
      "Use this to get the complete context for AI workers.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_update_todo_meta",
    description:
      "Update a todo's meta. By default, new meta is deep-merged with existing meta. " +
      "Set merge=false to replace the entire meta object. " +
      "Use this to store AI worker context, file references, progress data, etc.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        meta: {
          type: "object",
          description: "Meta object to set/merge. Can contain any JSON-serializable data.",
        },
        merge: {
          type: "boolean",
          description: "If true (default), deep-merge with existing meta. If false, replace entirely.",
          default: true,
        },
      },
      required: ["todoId", "meta"],
    },
  },
  {
    name: "threadcast_get_mission_meta",
    description: "Get a mission's own meta (not inherited from workspace).",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
      },
      required: ["missionId"],
    },
  },
  {
    name: "threadcast_get_mission_effective_meta",
    description:
      "Get a mission's effective meta (merged from Workspace → Mission). " +
      "Returns the mission-level context with workspace defaults applied.",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
      },
      required: ["missionId"],
    },
  },
  {
    name: "threadcast_update_mission_meta",
    description:
      "Update a mission's meta. By default, new meta is deep-merged with existing meta. " +
      "Mission meta is inherited by all todos in the mission.",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
        meta: {
          type: "object",
          description: "Meta object to set/merge.",
        },
        merge: {
          type: "boolean",
          description: "If true (default), deep-merge with existing meta. If false, replace entirely.",
          default: true,
        },
      },
      required: ["missionId", "meta"],
    },
  },
  {
    name: "threadcast_get_workspace_meta",
    description: "Get a workspace's meta. Workspace meta is the base layer inherited by all missions and todos.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
    },
  },
  {
    name: "threadcast_update_workspace_meta",
    description:
      "Update a workspace's meta. By default, new meta is deep-merged with existing meta. " +
      "Workspace meta provides default values for all missions and todos.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        meta: {
          type: "object",
          description: "Meta object to set/merge.",
        },
        merge: {
          type: "boolean",
          description: "If true (default), deep-merge with existing meta. If false, replace entirely.",
          default: true,
        },
      },
      required: ["meta"],
    },
  },
  // Session Context - for context recovery after compaction
  {
    name: "threadcast_get_session_context",
    description:
      "Get current session context for context recovery after compaction. " +
      "Returns aggregated information about: current workspace (with projectContext), " +
      "active mission and todo, recent progress, and a summary of what was being worked on. " +
      "Call this after context compaction to restore your working state.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Workspace ID to get session context for",
        },
      },
      required: ["workspaceId"],
    },
  },
  // Project Scanning
  {
    name: "threadcast_scan_workspace",
    description:
      "Scan a workspace's project directory and automatically extract metadata. " +
      "Detects: project type (single/monorepo), tech stack (languages, frameworks, build tools), " +
      "Git info (branch, remote, last commit), directory structure, dependencies, and scripts. " +
      "The scanned metadata is automatically saved to the workspace's meta.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID to scan" },
        path: {
          type: "string",
          description: "Project path to scan. If not provided, uses the workspace's configured path.",
        },
        merge: {
          type: "boolean",
          description: "If true (default), merge with existing meta. If false, replace entirely.",
          default: true,
        },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_scan_path",
    description:
      "Scan a project directory without saving to any workspace. " +
      "Returns the extracted metadata for preview or manual use. " +
      "Useful for analyzing a project before creating a workspace.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Project path to scan" },
      },
      required: ["path"],
    },
  },
  // AI Worker Flow
  {
    name: "threadcast_worker_start",
    description:
      "Start working on a Todo. This should be called when AI Worker begins a task. " +
      "It loads the effective meta (full context), updates Todo status to THREADING, " +
      "and sets the first step (ANALYSIS) to IN_PROGRESS. " +
      "Returns the complete context needed to work on the task.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to start working on" },
        workerInfo: {
          type: "object",
          description: "Optional info about the worker (e.g., model, session ID)",
          properties: {
            model: { type: "string", description: "AI model being used" },
            sessionId: { type: "string", description: "Session identifier" },
          },
        },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_worker_step_progress",
    description:
      "Update progress within the current step. Use this to record incremental progress, " +
      "files being analyzed/modified, or notes about the current step.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        step: {
          type: "string",
          enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"],
          description: "Current step type",
        },
        progress: {
          type: "object",
          description: "Progress information to record",
          properties: {
            status: { type: "string", description: "Brief status message" },
            filesAnalyzed: {
              type: "array",
              items: { type: "string" },
              description: "Files that have been analyzed",
            },
            filesModified: {
              type: "array",
              items: { type: "string" },
              description: "Files that have been modified",
            },
            notes: { type: "string", description: "Additional notes" },
            issues: {
              type: "array",
              items: { type: "string" },
              description: "Issues or blockers encountered",
            },
            insights: {
              type: "array",
              items: { type: "string" },
              description: "Contextual insights discovered (patterns, conventions, architecture)",
            },
          },
        },
      },
      required: ["todoId", "step", "progress"],
    },
  },
  {
    name: "threadcast_worker_step_complete",
    description:
      "Mark the current step as completed and optionally move to the next step. " +
      "Records step results in meta and updates step status.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        step: {
          type: "string",
          enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"],
          description: "Step that was completed",
        },
        result: {
          type: "object",
          description: "Results from this step",
          properties: {
            summary: { type: "string", description: "Brief summary of what was done" },
            findings: {
              type: "array",
              items: { type: "string" },
              description: "Key findings or decisions made",
            },
            filesModified: {
              type: "array",
              items: { type: "string" },
              description: "Files that were modified in this step",
            },
            nextStepHints: { type: "string", description: "Hints for the next step" },
            learnings: {
              type: "object",
              description: "Contextual knowledge learned (saved to workspace knowledge base)",
              properties: {
                patterns: {
                  type: "array",
                  items: { type: "string" },
                  description: "Code patterns discovered (e.g., 'CVA for component variants')",
                },
                conventions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Coding conventions found (e.g., 'cn() for className merge')",
                },
                architecture: {
                  type: "array",
                  items: { type: "string" },
                  description: "Architecture decisions (e.g., 'Zustand for state management')",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key dependencies used (e.g., 'class-variance-authority')",
                },
              },
            },
          },
        },
        nextStep: {
          type: "string",
          enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"],
          description: "Next step to start (optional, auto-advances if not specified)",
        },
        skipToComplete: {
          type: "boolean",
          description: "If true, skip remaining steps and complete the todo",
        },
      },
      required: ["todoId", "step"],
    },
  },
  {
    name: "threadcast_worker_complete",
    description:
      "Mark the Todo as completed (WOVEN). Records final results and summary. " +
      "Call this when all work on the Todo is done successfully.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        result: {
          type: "object",
          description: "Final results of the work",
          properties: {
            summary: { type: "string", description: "Summary of what was accomplished" },
            filesCreated: {
              type: "array",
              items: { type: "string" },
              description: "New files that were created",
            },
            filesModified: {
              type: "array",
              items: { type: "string" },
              description: "Existing files that were modified",
            },
            filesDeleted: {
              type: "array",
              items: { type: "string" },
              description: "Files that were deleted",
            },
            testsAdded: { type: "number", description: "Number of tests added" },
            testsPassed: { type: "boolean", description: "Whether tests passed" },
            nextSteps: {
              type: "array",
              items: { type: "string" },
              description: "Suggested follow-up tasks",
            },
            notes: { type: "string", description: "Additional notes or caveats" },
            learnings: {
              type: "object",
              description: "Knowledge gained from this work (auto-saved to workspace knowledge base)",
              properties: {
                patterns: {
                  type: "array",
                  items: { type: "string" },
                  description: "Code patterns discovered",
                },
                conventions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Coding conventions found",
                },
                architecture: {
                  type: "array",
                  items: { type: "string" },
                  description: "Architecture decisions",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key dependencies used",
                },
                tips: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tips for future similar work",
                },
              },
            },
          },
        },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_worker_fail",
    description:
      "Mark the Todo as failed (TANGLED). Records the failure reason and any partial progress. " +
      "Call this when the work cannot be completed due to errors or blockers.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        failure: {
          type: "object",
          description: "Information about the failure",
          properties: {
            reason: { type: "string", description: "Why the work failed" },
            step: {
              type: "string",
              enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"],
              description: "Step where failure occurred",
            },
            error: { type: "string", description: "Error message if any" },
            partialProgress: { type: "string", description: "What was accomplished before failure" },
            blockers: {
              type: "array",
              items: { type: "string" },
              description: "Blockers that prevented completion",
            },
            canRetry: { type: "boolean", description: "Whether the task can be retried" },
            retryHints: { type: "string", description: "Hints for retry if applicable" },
          },
          required: ["reason"],
        },
      },
      required: ["todoId", "failure"],
    },
  },
  // Context Analysis
  {
    name: "threadcast_analyze_mission_context",
    description:
      "Analyze a Mission's title and description to extract context metadata. " +
      "Finds related modules, files, determines scope (frontend/backend/fullstack), " +
      "matches tech stack, and suggests approach. " +
      "Results are saved to the Mission's meta.analysis field.",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID to analyze" },
        saveToMeta: {
          type: "boolean",
          description: "If true (default), save analysis results to mission meta",
          default: true,
        },
      },
      required: ["missionId"],
    },
  },
  {
    name: "threadcast_analyze_todo_context",
    description:
      "Analyze a Todo's title and description to extract context metadata. " +
      "Finds related files, determines scope, and suggests implementation approach. " +
      "More granular than mission analysis - focuses on specific files to modify. " +
      "Results are saved to the Todo's meta.analysis field.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to analyze" },
        saveToMeta: {
          type: "boolean",
          description: "If true (default), save analysis results to todo meta",
          default: true,
        },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_analyze_text",
    description:
      "Analyze arbitrary text to extract context metadata without saving. " +
      "Useful for previewing what context would be extracted before creating a Mission/Todo. " +
      "Requires workspaceId to access project structure for file matching.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID for project context" },
        title: { type: "string", description: "Title text to analyze" },
        description: { type: "string", description: "Description text to analyze" },
      },
      required: ["workspaceId", "description"],
    },
  },
  // Knowledge Base
  {
    name: "threadcast_remember",
    description:
      "Explicitly save knowledge to the workspace's knowledge base. " +
      "Use this when you learn something important that should persist across sessions. " +
      "Examples: deployment procedures, credentials locations, coding conventions, architecture decisions. " +
      "The knowledge will be available in effective-meta for all future work.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        topic: {
          type: "string",
          description: "Topic identifier (e.g., 'deployment', 'auth', 'conventions'). Use kebab-case.",
        },
        summary: {
          type: "string",
          description: "Brief summary of the knowledge (1-2 sentences)",
        },
        details: {
          type: "object",
          description: "Structured details as key-value pairs. Include actionable information.",
          additionalProperties: true,
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords for searching this knowledge later",
        },
        source: {
          type: "string",
          description: "Where this knowledge came from (e.g., 'AWS deployment task', 'user instruction')",
        },
      },
      required: ["topic", "summary"],
    },
  },
  {
    name: "threadcast_learn_from_work",
    description:
      "Automatically extract and save knowledge from completed work. " +
      "Analyzes the todo's meta (worker info, steps, result) and extracts reusable knowledge. " +
      "Call this after completing important tasks that contain learnings for future reference.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to learn from" },
        additionalContext: {
          type: "string",
          description: "Additional context to include in the learning (optional)",
        },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_get_knowledge",
    description:
      "Get a specific knowledge entry by topic. " +
      "Returns the full knowledge object including summary, details, and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        topic: { type: "string", description: "Topic identifier to retrieve" },
      },
      required: ["topic"],
    },
  },
  {
    name: "threadcast_list_knowledge",
    description:
      "List all knowledge entries in the workspace. " +
      "Returns topic names with their summaries for quick overview.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
    },
  },
  {
    name: "threadcast_search_knowledge",
    description:
      "Search knowledge base by keywords. " +
      "Returns matching knowledge entries sorted by relevance.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        query: { type: "string", description: "Search query (matches against keywords, topic, summary)" },
      },
      required: ["query"],
    },
  },
  {
    name: "threadcast_forget",
    description:
      "Remove a knowledge entry from the workspace. " +
      "Use when knowledge is outdated or no longer relevant.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        topic: { type: "string", description: "Topic identifier to remove" },
      },
      required: ["topic"],
    },
  },

  // ==================== JIRA Integration ====================
  {
    name: "threadcast_jira_status",
    description:
      "Get JIRA connection status for a workspace. " +
      "Returns connection info if connected, or indicates not connected.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_jira_connect",
    description:
      "Connect to JIRA using API Token or Personal Access Token (PAT). " +
      "For Cloud: use API_TOKEN auth with email. " +
      "For Server/Data Center: use API_TOKEN with email or PAT without email.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        instanceType: {
          type: "string",
          enum: ["CLOUD", "SERVER", "DATA_CENTER"],
          description: "JIRA instance type",
        },
        baseUrl: { type: "string", description: "JIRA base URL (e.g., https://your-domain.atlassian.net)" },
        authType: {
          type: "string",
          enum: ["API_TOKEN", "PAT"],
          description: "Authentication type",
        },
        apiToken: { type: "string", description: "API Token or PAT" },
        email: { type: "string", description: "Email (required for API_TOKEN auth)" },
        defaultProjectKey: { type: "string", description: "Default project key for imports" },
      },
      required: ["workspaceId", "instanceType", "baseUrl", "authType", "apiToken"],
    },
  },
  {
    name: "threadcast_jira_disconnect",
    description: "Disconnect JIRA integration from a workspace.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_jira_list_projects",
    description: "List all accessible JIRA projects.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_jira_search_issues",
    description:
      "Search JIRA issues using JQL (JIRA Query Language). " +
      "Examples: 'project = PROJ AND status = Open', 'assignee = currentUser()', " +
      "'issuetype = Epic AND status != Done'",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        jql: { type: "string", description: "JQL query string" },
        maxResults: { type: "number", description: "Maximum results to return (default: 50)" },
      },
      required: ["workspaceId", "jql"],
    },
  },
  {
    name: "threadcast_jira_get_issue",
    description: "Get detailed information about a specific JIRA issue.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        issueKey: { type: "string", description: "JIRA issue key (e.g., PROJ-123)" },
      },
      required: ["workspaceId", "issueKey"],
    },
  },
  {
    name: "threadcast_jira_import_issue",
    description:
      "Import a single JIRA issue as a ThreadCast Mission or Todo. " +
      "Use targetType=MISSION for standalone issues or Epics. " +
      "Use targetType=TODO for importing into an existing Mission.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        issueKey: { type: "string", description: "JIRA issue key to import" },
        targetType: {
          type: "string",
          enum: ["MISSION", "TODO"],
          description: "Import as Mission or Todo",
        },
        missionId: { type: "string", description: "Mission ID (required when targetType=TODO)" },
        orderIndex: { type: "number", description: "Todo order index (optional, defaults to last)" },
      },
      required: ["workspaceId", "issueKey", "targetType"],
    },
  },
  {
    name: "threadcast_jira_import_epic",
    description:
      "Import a JIRA Epic as a Mission with all child issues as Todos. " +
      "Automatically creates the Mission from the Epic and Todos from Stories/Tasks/Bugs.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        epicKey: { type: "string", description: "JIRA Epic key to import" },
        includeChildren: {
          type: "boolean",
          description: "Include child issues as Todos (default: true)",
        },
        issueTypes: {
          type: "array",
          items: { type: "string" },
          description: "Filter by issue types (e.g., ['Story', 'Task', 'Bug'])",
        },
        includeCompleted: {
          type: "boolean",
          description: "Include completed issues (default: false)",
        },
      },
      required: ["workspaceId", "epicKey"],
    },
  },
  {
    name: "threadcast_jira_list_mappings",
    description:
      "List all JIRA issue mappings for a workspace. " +
      "Shows which JIRA issues are linked to which Missions/Todos.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_jira_unlink",
    description:
      "Unlink a JIRA issue mapping. " +
      "Removes the link between JIRA and ThreadCast without deleting the Mission/Todo.",
    inputSchema: {
      type: "object",
      properties: {
        mappingId: { type: "string", description: "Mapping ID to unlink" },
      },
      required: ["mappingId"],
    },
  },
  // ==================== PM Agent ====================
  {
    name: "threadcast_pm_agent_register",
    description:
      "Register this PM Agent with a workspace. " +
      "Call this when the agent starts to establish connection with ThreadCast. " +
      "This enables the workspace to track agent status and enables full functionality.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID to register with" },
        machineId: { type: "string", description: "Unique machine identifier (e.g., hostname or UUID)" },
        label: { type: "string", description: "Human-readable label for this agent (e.g., 'PM Agent - MacBook')" },
        agentVersion: { type: "string", description: "Agent version string" },
      },
      required: ["workspaceId", "machineId"],
    },
  },
  {
    name: "threadcast_pm_agent_disconnect",
    description:
      "Disconnect this PM Agent from a workspace. " +
      "Call this when the agent is shutting down gracefully.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_pm_agent_heartbeat",
    description:
      "Send a heartbeat to keep the agent connection alive. " +
      "Should be called periodically (every 30 seconds recommended). " +
      "Also updates current work status.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        currentTodoId: { type: "string", description: "Currently working Todo ID (optional)" },
        currentTodoTitle: { type: "string", description: "Currently working Todo title (optional)" },
        activeTodoCount: { type: "number", description: "Number of active Todos (optional)" },
      },
      required: ["workspaceId"],
    },
  },
  {
    name: "threadcast_pm_agent_status",
    description:
      "Get PM Agent status for a workspace. " +
      "Returns connection status, current work, and agent info.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
  },
];

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Auth
      case "threadcast_login":
        result = await client.login(args?.email as string, args?.password as string);
        break;

      // Workspace
      case "threadcast_list_workspaces":
        result = await client.listWorkspaces();
        break;
      case "threadcast_create_workspace":
        result = await client.createWorkspace(args?.name as string, args?.path as string, args?.description as string);
        break;
      case "threadcast_delete_workspace":
        result = await client.deleteWorkspace(args?.id as string);
        break;

      // Mission
      case "threadcast_list_missions":
        result = await client.listMissions(
          getWorkspaceId(args?.workspaceId as string),
          args?.status as string
        );
        break;
      case "threadcast_get_mission":
        result = await client.getMission(args?.id as string);
        break;
      case "threadcast_create_mission":
        result = await client.createMission(
          getWorkspaceId(args?.workspaceId as string),
          args?.title as string,
          args?.description as string,
          (args?.priority as string) || "MEDIUM"
        );
        break;
      case "threadcast_update_mission_status":
        result = await client.updateMissionStatus(args?.id as string, args?.status as string);
        break;
      case "threadcast_update_mission":
        result = await client.updateMission(args?.id as string, {
          title: args?.title as string | undefined,
          description: args?.description as string | undefined,
          priority: args?.priority as string | undefined,
        });
        break;
      case "threadcast_delete_mission":
        result = await client.deleteMission(args?.id as string);
        break;
      case "threadcast_start_weaving":
        result = await client.startWeaving(args?.id as string);
        break;
      case "threadcast_analyze_mission":
        result = await client.analyzeMission(args?.id as string);
        break;

      // Todo
      case "threadcast_list_todos":
        result = await client.listTodos(args?.missionId as string);
        break;
      case "threadcast_get_todo":
        result = await client.getTodo(args?.id as string);
        break;
      case "threadcast_create_todo":
        result = await client.createTodo(
          args?.missionId as string,
          args?.title as string,
          args?.description as string,
          (args?.complexity as string) || "MEDIUM",
          args?.estimatedTime as number
        );
        break;
      case "threadcast_delete_todo":
        result = await client.deleteTodo(args?.id as string);
        break;
      case "threadcast_update_todo_status":
        result = await client.updateTodoStatus(args?.id as string, args?.status as string);
        break;
      case "threadcast_update_step_status":
        result = await client.updateStepStatus(
          args?.todoId as string,
          args?.stepType as string,
          args?.status as string
        );
        break;
      case "threadcast_start_worker":
        result = await client.startWorker(args?.todoId as string);
        break;
      case "threadcast_stop_worker":
        result = await client.stopWorker(args?.todoId as string);
        break;

      // AI Questions
      case "threadcast_list_questions":
        result = await client.listAIQuestions(args?.workspaceId as string);
        break;
      case "threadcast_answer_question":
        result = await client.answerQuestion(args?.questionId as string, args?.answer as string);
        break;
      case "threadcast_skip_question":
        result = await client.skipQuestion(args?.questionId as string);
        break;
      case "threadcast_create_ai_question":
        result = await client.createAIQuestion(
          args?.todoId as string,
          args?.question as string,
          (args?.category as string) || "CLARIFICATION",
          args?.options as string[]
        );
        break;

      // Workspace Settings
      case "threadcast_get_workspace_settings":
        result = await client.getWorkspaceSettings(
          getWorkspaceId(args?.workspaceId as string)
        );
        break;

      // Todo Dependencies
      case "threadcast_update_dependencies":
        result = await client.updateTodoDependencies(
          args?.todoId as string,
          args?.dependencies as string[]
        );
        break;
      case "threadcast_get_ready_todos":
        result = await client.getReadyTodos(args?.missionId as string);
        break;

      // Timeline
      case "threadcast_get_timeline":
        result = await client.getTimeline(
          getWorkspaceId(args?.workspaceId as string),
          (args?.limit as number) || 20
        );
        break;

      // AI Mission Generation
      case "threadcast_generate_mission_ai":
        result = await client.generateMissionFromPrompt(args?.prompt as string);
        break;
      case "threadcast_create_mission_ai": {
        const generated = await client.generateMissionFromPrompt(args?.prompt as string);
        const createResult = await client.createMissionWithTodos(
          getWorkspaceId(args?.workspaceId as string),
          generated,
          args?.createQuestions !== false // default to true
        );
        result = {
          ...createResult,
          questionsCreated: createResult.questions.length,
          message: createResult.questions.length > 0
            ? `미션과 ${createResult.todos.length}개의 TODO가 생성되었습니다. ${createResult.questions.length}개의 AI 질문이 생성되어 사용자 응답을 기다리고 있습니다.`
            : `미션과 ${createResult.todos.length}개의 TODO가 생성되었습니다.`,
        };
        break;
      }

      // Meta Management
      case "threadcast_get_todo_meta":
        result = await client.getTodoMeta(args?.todoId as string);
        break;
      case "threadcast_get_todo_effective_meta":
        result = await client.getTodoEffectiveMeta(args?.todoId as string);
        break;
      case "threadcast_update_todo_meta":
        result = await client.updateTodoMeta(
          args?.todoId as string,
          args?.meta as Record<string, unknown>,
          args?.merge !== false // default to true
        );
        break;
      case "threadcast_get_mission_meta":
        result = await client.getMissionMeta(args?.missionId as string);
        break;
      case "threadcast_get_mission_effective_meta":
        result = await client.getMissionEffectiveMeta(args?.missionId as string);
        break;
      case "threadcast_update_mission_meta":
        result = await client.updateMissionMeta(
          args?.missionId as string,
          args?.meta as Record<string, unknown>,
          args?.merge !== false // default to true
        );
        break;
      case "threadcast_get_workspace_meta":
        result = await client.getWorkspaceMeta(
          getWorkspaceId(args?.workspaceId as string)
        );
        break;
      case "threadcast_update_workspace_meta":
        result = await client.updateWorkspaceMeta(
          getWorkspaceId(args?.workspaceId as string),
          args?.meta as Record<string, unknown>,
          args?.merge !== false // default to true
        );
        break;

      case "threadcast_get_session_context": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required for get_session_context");
        }
        result = await client.getSessionContext(workspaceId);
        break;
      }

      // Project Scanning
      case "threadcast_scan_workspace": {
        const workspaceId = args?.workspaceId as string;
        let scanPath = args?.path as string;

        // If no path provided, get workspace path from API
        if (!scanPath) {
          const workspace = await client.getWorkspace(workspaceId);
          scanPath = workspace.path;
        }

        if (!scanPath) {
          throw new Error("No path provided and workspace has no configured path");
        }

        // Expand home directory
        if (scanPath.startsWith("~")) {
          scanPath = scanPath.replace("~", process.env.HOME || "");
        }

        // Scan the project
        const scanner = new ProjectScanner(scanPath);
        const projectMeta = await scanner.scan();

        // Save to workspace meta
        await client.updateWorkspaceMeta(
          workspaceId,
          projectMeta as unknown as Record<string, unknown>,
          args?.merge !== false
        );

        result = {
          message: `Workspace scanned successfully: ${scanPath}`,
          meta: projectMeta,
        };
        break;
      }

      case "threadcast_scan_path": {
        let scanPath = args?.path as string;

        if (!scanPath) {
          throw new Error("Path is required");
        }

        // Expand home directory
        if (scanPath.startsWith("~")) {
          scanPath = scanPath.replace("~", process.env.HOME || "");
        }

        // Scan the project
        const scanner = new ProjectScanner(scanPath);
        const projectMeta = await scanner.scan();

        result = projectMeta;
        break;
      }

      // AI Worker Flow
      case "threadcast_worker_start": {
        const todoId = args?.todoId as string;
        const workerInfo = args?.workerInfo as Record<string, unknown> | undefined;

        // 1. Load effective meta (full context including answered questions)
        const effectiveMeta = await client.getTodoEffectiveMeta(todoId);

        // 2. Extract answered questions for easy access
        const answeredQuestions = (effectiveMeta as Record<string, unknown>)?.answeredQuestions || [];

        // 3. Update todo status to THREADING
        await client.updateTodoStatus(todoId, "THREADING");

        // 4. Set first step to IN_PROGRESS
        await client.updateStepStatus(todoId, "ANALYSIS", "IN_PROGRESS");

        // 5. Record worker start in meta
        const workerMeta: Record<string, unknown> = {
          worker: {
            startedAt: new Date().toISOString(),
            status: "running",
            currentStep: "ANALYSIS",
            ...(workerInfo || {}),
          },
        };
        await client.updateTodoMeta(todoId, workerMeta, true);

        result = {
          message: "Worker started successfully",
          todoId,
          status: "THREADING",
          currentStep: "ANALYSIS",
          context: effectiveMeta,
          // Highlighted for easy access - user decisions from AI questions
          userDecisions: answeredQuestions,
        };
        break;
      }

      case "threadcast_worker_step_progress": {
        const todoId = args?.todoId as string;
        const step = args?.step as string;
        const progress = args?.progress as Record<string, unknown>;

        // Update progress in meta
        const progressMeta: Record<string, unknown> = {
          worker: {
            currentStep: step,
            lastUpdate: new Date().toISOString(),
          },
          steps: {
            [step]: {
              progress,
              updatedAt: new Date().toISOString(),
            },
          },
        };
        await client.updateTodoMeta(todoId, progressMeta, true);

        result = {
          message: `Progress updated for step ${step}`,
          todoId,
          step,
          progress,
        };
        break;
      }

      case "threadcast_worker_step_complete": {
        const todoId = args?.todoId as string;
        const step = args?.step as string;
        const stepResult = args?.result as Record<string, unknown> | undefined;
        const nextStep = args?.nextStep as string | undefined;
        const skipToComplete = args?.skipToComplete as boolean | undefined;

        // 1. Mark current step as completed
        await client.updateStepStatus(todoId, step, "COMPLETED");

        // 2. Record step result in meta
        const stepMeta: Record<string, unknown> = {
          steps: {
            [step]: {
              status: "COMPLETED",
              completedAt: new Date().toISOString(),
              result: stepResult || {},
            },
          },
        };

        // 2.5. If learnings provided, save to workspace knowledge base
        const learnings = stepResult?.learnings as Record<string, string[]> | undefined;
        if (learnings && Object.keys(learnings).length > 0) {
          try {
            // Get workspace ID from todo's mission
            const todo = await client.getTodo(todoId);
            const missionId = (todo as { missionId?: string }).missionId;
            if (missionId) {
              const mission = await client.getMission(missionId);
              const workspaceId = (mission as { workspaceId?: string }).workspaceId;

              if (workspaceId) {
                // Get existing workspace meta to properly merge arrays
                const existingMeta = await client.getWorkspaceMeta(workspaceId);
                const existingContext = (existingMeta as { projectContext?: Record<string, string[]> })?.projectContext || {};

                // Helper to merge arrays and remove duplicates
                const mergeArrays = (existing: string[] | undefined, newItems: string[] | undefined): string[] => {
                  const combined = [...(existing || []), ...(newItems || [])];
                  return [...new Set(combined)];
                };

                // Accumulate learnings in workspace meta under 'projectContext'
                const projectContext: Record<string, unknown> = {};
                if (learnings.patterns?.length) projectContext.patterns = mergeArrays(existingContext.patterns, learnings.patterns);
                if (learnings.conventions?.length) projectContext.conventions = mergeArrays(existingContext.conventions, learnings.conventions);
                if (learnings.architecture?.length) projectContext.architecture = mergeArrays(existingContext.architecture, learnings.architecture);
                if (learnings.dependencies?.length) projectContext.dependencies = mergeArrays(existingContext.dependencies, learnings.dependencies);

                if (Object.keys(projectContext).length > 0) {
                  await client.updateWorkspaceMeta(workspaceId, { projectContext }, true);
                }
              }
            }
          } catch (e) {
            // Silently ignore if saving learnings fails
            console.error("Failed to save learnings:", e);
          }
        }

        // 3. Determine and start next step
        const stepOrder = ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"];
        const currentIndex = stepOrder.indexOf(step);
        let actualNextStep: string | null = null;

        if (skipToComplete) {
          // Skip remaining steps
          stepMeta.worker = {
            currentStep: null,
            status: "completing",
          };
        } else if (nextStep) {
          actualNextStep = nextStep;
        } else if (currentIndex < stepOrder.length - 1) {
          actualNextStep = stepOrder[currentIndex + 1];
        }

        if (actualNextStep) {
          await client.updateStepStatus(todoId, actualNextStep, "IN_PROGRESS");
          stepMeta.worker = {
            currentStep: actualNextStep,
            lastUpdate: new Date().toISOString(),
          };
        }

        await client.updateTodoMeta(todoId, stepMeta, true);

        result = {
          message: `Step ${step} completed`,
          todoId,
          completedStep: step,
          nextStep: actualNextStep,
          skipToComplete: skipToComplete || false,
        };
        break;
      }

      case "threadcast_worker_complete": {
        const todoId = args?.todoId as string;
        const finalResult = args?.result as Record<string, unknown> | undefined;

        // 1. Record final result in meta
        const completeMeta: Record<string, unknown> = {
          worker: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
          result: {
            ...(finalResult || {}),
            completedAt: new Date().toISOString(),
          },
        };
        await client.updateTodoMeta(todoId, completeMeta, true);

        // 1.5. If learnings provided, save to workspace knowledge base
        const learnings = finalResult?.learnings as Record<string, string[]> | undefined;
        if (learnings && Object.keys(learnings).length > 0) {
          try {
            // Get workspace ID from todo's mission
            const todo = await client.getTodo(todoId);
            const missionId = (todo as { missionId?: string }).missionId;
            if (missionId) {
              const mission = await client.getMission(missionId);
              const workspaceId = (mission as { workspaceId?: string }).workspaceId;

              if (workspaceId) {
                // Get existing workspace meta to properly merge arrays
                const existingMeta = await client.getWorkspaceMeta(workspaceId);
                const existingContext = (existingMeta as { projectContext?: Record<string, string[]> })?.projectContext || {};

                // Helper to merge arrays and remove duplicates
                const mergeArrays = (existing: string[] | undefined, newItems: string[] | undefined): string[] => {
                  const combined = [...(existing || []), ...(newItems || [])];
                  return [...new Set(combined)];
                };

                // Accumulate learnings in workspace meta under 'projectContext'
                const projectContext: Record<string, unknown> = {};
                if (learnings.patterns?.length) projectContext.patterns = mergeArrays(existingContext.patterns, learnings.patterns);
                if (learnings.conventions?.length) projectContext.conventions = mergeArrays(existingContext.conventions, learnings.conventions);
                if (learnings.architecture?.length) projectContext.architecture = mergeArrays(existingContext.architecture, learnings.architecture);
                if (learnings.dependencies?.length) projectContext.dependencies = mergeArrays(existingContext.dependencies, learnings.dependencies);
                if (learnings.tips?.length) projectContext.tips = mergeArrays(existingContext.tips, learnings.tips);

                if (Object.keys(projectContext).length > 0) {
                  await client.updateWorkspaceMeta(workspaceId, { projectContext }, true);
                }
              }
            }
          } catch (e) {
            // Silently ignore if saving learnings fails
            console.error("Failed to save learnings:", e);
          }
        }

        // 2. Update todo status to WOVEN
        await client.updateTodoStatus(todoId, "WOVEN");

        result = {
          message: "Todo completed successfully",
          todoId,
          status: "WOVEN",
          result: finalResult,
        };
        break;
      }

      case "threadcast_worker_fail": {
        const todoId = args?.todoId as string;
        const failure = args?.failure as Record<string, unknown>;

        // 1. Record failure in meta
        const failMeta: Record<string, unknown> = {
          worker: {
            status: "failed",
            failedAt: new Date().toISOString(),
          },
          failure: {
            ...failure,
            failedAt: new Date().toISOString(),
          },
        };
        await client.updateTodoMeta(todoId, failMeta, true);

        // 2. Update todo status to TANGLED
        await client.updateTodoStatus(todoId, "TANGLED");

        result = {
          message: "Todo marked as failed",
          todoId,
          status: "TANGLED",
          failure,
        };
        break;
      }

      // Context Analysis
      case "threadcast_analyze_mission_context": {
        const missionId = args?.missionId as string;
        const saveToMeta = args?.saveToMeta !== false;

        // 1. Get mission details
        const mission = await client.getMission(missionId);

        // 2. Get workspace meta for project info
        const workspaceMeta = await client.getWorkspaceMeta(mission.workspaceId);

        // 3. Analyze
        let projectPath = mission.workspacePath || workspaceMeta?.structure?.rootFiles ? "." : ".";
        if (mission.workspacePath) {
          projectPath = mission.workspacePath;
          if (projectPath.startsWith("~")) {
            projectPath = projectPath.replace("~", process.env.HOME || "");
          }
        }

        const analyzer = new ContextAnalyzer(projectPath, workspaceMeta as ProjectMeta);
        const analysis = await analyzer.analyzeDescription(
          mission.description || "",
          mission.title
        );

        // 4. Save to meta if requested
        if (saveToMeta) {
          await client.updateMissionMeta(missionId, { analysis }, true);
        }

        result = {
          message: "Mission context analyzed",
          missionId,
          analysis,
          savedToMeta: saveToMeta,
        };
        break;
      }

      case "threadcast_analyze_todo_context": {
        const todoId = args?.todoId as string;
        const saveToMeta = args?.saveToMeta !== false;

        // 1. Get todo details with effective meta
        const todo = await client.getTodo(todoId);
        const effectiveMeta = await client.getTodoEffectiveMeta(todoId);

        // 2. Get project path
        let projectPath = todo.workingPath || effectiveMeta?.workingDir || ".";
        if (projectPath.startsWith("~")) {
          projectPath = projectPath.replace("~", process.env.HOME || "");
        }

        // 3. Analyze
        const analyzer = new ContextAnalyzer(projectPath, effectiveMeta as ProjectMeta);
        const analysis = await analyzer.analyzeDescription(
          todo.description || "",
          todo.title
        );

        // 4. Save to meta if requested
        if (saveToMeta) {
          await client.updateTodoMeta(todoId, { analysis }, true);
        }

        result = {
          message: "Todo context analyzed",
          todoId,
          analysis,
          savedToMeta: saveToMeta,
        };
        break;
      }

      case "threadcast_analyze_text": {
        const workspaceId = args?.workspaceId as string;
        const title = args?.title as string;
        const description = args?.description as string;

        // 1. Get workspace info
        const workspace = await client.getWorkspace(workspaceId);
        const workspaceMeta = await client.getWorkspaceMeta(workspaceId);

        // 2. Get project path
        let projectPath = workspace.path || ".";
        if (projectPath.startsWith("~")) {
          projectPath = projectPath.replace("~", process.env.HOME || "");
        }

        // 3. Analyze
        const analyzer = new ContextAnalyzer(projectPath, workspaceMeta as ProjectMeta);
        const analysis = await analyzer.analyzeDescription(description, title);

        result = {
          message: "Text analyzed",
          analysis,
        };
        break;
      }

      // Knowledge Base
      case "threadcast_remember": {
        const workspaceId = getWorkspaceId(args?.workspaceId as string);
        const topic = args?.topic as string;
        const summary = args?.summary as string;
        const details = args?.details as Record<string, unknown> | undefined;
        const keywords = args?.keywords as string[] | undefined;
        const source = args?.source as string | undefined;

        // Get current workspace meta
        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        // Add/update knowledge entry
        knowledge[topic] = {
          summary,
          details: details || {},
          keywords: keywords || [],
          source: source || "manual",
          learnedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to workspace meta
        await client.updateWorkspaceMeta(workspaceId, { knowledge }, true);

        result = {
          message: `Knowledge saved: ${topic}`,
          topic,
          knowledge: knowledge[topic],
        };
        break;
      }

      case "threadcast_learn_from_work": {
        const todoId = args?.todoId as string;
        const additionalContext = args?.additionalContext as string | undefined;

        // Get todo with its meta
        const todo = await client.getTodo(todoId);
        const todoMeta = await client.getTodoMeta(todoId);
        const effectiveMeta = await client.getTodoEffectiveMeta(todoId);

        // Extract knowledge from the work
        const workerInfo = (todoMeta as Record<string, unknown>)?.worker as Record<string, unknown> || {};
        const steps = (todoMeta as Record<string, unknown>)?.steps as Record<string, unknown> || {};
        const workResult = (todoMeta as Record<string, unknown>)?.result as Record<string, unknown> || {};

        // Build knowledge entry
        const topicBase = todo.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 30);
        const topic = `learned-${topicBase}`;

        const details: Record<string, unknown> = {};

        // Extract from result
        if (workResult.filesModified) {
          details.filesModified = workResult.filesModified;
        }
        if (workResult.filesCreated) {
          details.filesCreated = workResult.filesCreated;
        }
        if (workResult.nextSteps) {
          details.suggestedNextSteps = workResult.nextSteps;
        }

        // Extract from steps
        const stepSummaries: Record<string, string> = {};
        for (const [stepName, stepData] of Object.entries(steps)) {
          const stepInfo = stepData as Record<string, unknown>;
          if (stepInfo.result) {
            const stepResult = stepInfo.result as Record<string, unknown>;
            if (stepResult.summary) {
              stepSummaries[stepName] = stepResult.summary as string;
            }
          }
        }
        if (Object.keys(stepSummaries).length > 0) {
          details.stepSummaries = stepSummaries;
        }

        // Add additional context
        if (additionalContext) {
          details.additionalContext = additionalContext;
        }

        // Build summary
        const summary = workResult.summary as string ||
          `${todo.title} 작업 완료. ${Object.keys(stepSummaries).length}개 단계 수행.`;

        // Extract keywords from todo title and description
        const keywords = [
          ...todo.title.split(/\s+/).filter((w: string) => w.length > 2),
          ...(todo.description?.split(/\s+/).filter((w: string) => w.length > 3) || []),
        ].slice(0, 10);

        // Get workspace ID from effective meta
        const workspaceId = getWorkspaceId((effectiveMeta as Record<string, unknown>)?.workspaceId as string);

        // Save knowledge
        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        knowledge[topic] = {
          summary,
          details,
          keywords,
          source: `Todo: ${todo.title} (${todoId})`,
          missionId: todo.missionId,
          learnedAt: new Date().toISOString(),
        };

        await client.updateWorkspaceMeta(workspaceId, { knowledge }, true);

        result = {
          message: `Knowledge extracted and saved: ${topic}`,
          topic,
          knowledge: knowledge[topic],
        };
        break;
      }

      case "threadcast_get_knowledge": {
        const workspaceId = getWorkspaceId(args?.workspaceId as string);
        const topic = args?.topic as string;

        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        if (!knowledge[topic]) {
          result = {
            message: `Knowledge not found: ${topic}`,
            topic,
            found: false,
          };
        } else {
          result = {
            message: `Knowledge found: ${topic}`,
            topic,
            found: true,
            knowledge: knowledge[topic],
          };
        }
        break;
      }

      case "threadcast_list_knowledge": {
        const workspaceId = getWorkspaceId(args?.workspaceId as string);

        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        const entries = Object.entries(knowledge).map(([topic, data]) => {
          const entry = data as Record<string, unknown>;
          return {
            topic,
            summary: entry.summary,
            keywords: entry.keywords,
            learnedAt: entry.learnedAt,
            source: entry.source,
          };
        });

        result = {
          message: `Found ${entries.length} knowledge entries`,
          count: entries.length,
          entries,
        };
        break;
      }

      case "threadcast_search_knowledge": {
        const workspaceId = getWorkspaceId(args?.workspaceId as string);
        const query = (args?.query as string).toLowerCase();

        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        const matches: Array<{ topic: string; score: number; knowledge: unknown }> = [];

        for (const [topic, data] of Object.entries(knowledge)) {
          const entry = data as Record<string, unknown>;
          let score = 0;

          // Match topic
          if (topic.toLowerCase().includes(query)) {
            score += 10;
          }

          // Match summary
          if ((entry.summary as string)?.toLowerCase().includes(query)) {
            score += 5;
          }

          // Match keywords
          const keywords = entry.keywords as string[] || [];
          for (const kw of keywords) {
            if (kw.toLowerCase().includes(query) || query.includes(kw.toLowerCase())) {
              score += 3;
            }
          }

          if (score > 0) {
            matches.push({ topic, score, knowledge: entry });
          }
        }

        // Sort by score
        matches.sort((a, b) => b.score - a.score);

        result = {
          message: `Found ${matches.length} matching entries for "${query}"`,
          query,
          count: matches.length,
          matches: matches.slice(0, 10), // Limit to top 10
        };
        break;
      }

      case "threadcast_forget": {
        const workspaceId = getWorkspaceId(args?.workspaceId as string);
        const topic = args?.topic as string;

        const currentMeta = await client.getWorkspaceMeta(workspaceId);
        const knowledge = (currentMeta as Record<string, unknown>)?.knowledge as Record<string, unknown> || {};

        if (!knowledge[topic]) {
          result = {
            message: `Knowledge not found: ${topic}`,
            topic,
            deleted: false,
          };
        } else {
          delete knowledge[topic];
          await client.updateWorkspaceMeta(workspaceId, { knowledge }, false); // Replace entirely

          result = {
            message: `Knowledge deleted: ${topic}`,
            topic,
            deleted: true,
          };
        }
        break;
      }

      // ==================== JIRA Integration ====================
      case "threadcast_jira_status": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.getJiraStatus(workspaceId);
        break;
      }

      case "threadcast_jira_connect": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.connectJira(
          workspaceId,
          args?.instanceType as string,
          args?.baseUrl as string,
          args?.authType as string,
          args?.apiToken as string,
          args?.email as string,
          args?.defaultProjectKey as string
        );
        break;
      }

      case "threadcast_jira_disconnect": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.disconnectJira(workspaceId);
        break;
      }

      case "threadcast_jira_list_projects": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.getJiraProjects(workspaceId);
        break;
      }

      case "threadcast_jira_search_issues": {
        const workspaceId = args?.workspaceId as string;
        const jql = args?.jql as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        if (!jql) {
          throw new Error("jql is required");
        }
        result = await client.searchJiraIssues(
          workspaceId,
          jql,
          (args?.maxResults as number) || 50
        );
        break;
      }

      case "threadcast_jira_get_issue": {
        const workspaceId = args?.workspaceId as string;
        const issueKey = args?.issueKey as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        if (!issueKey) {
          throw new Error("issueKey is required");
        }
        result = await client.getJiraIssue(workspaceId, issueKey);
        break;
      }

      case "threadcast_jira_import_issue": {
        const workspaceId = args?.workspaceId as string;
        const issueKey = args?.issueKey as string;
        const targetType = args?.targetType as "MISSION" | "TODO";
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        if (!issueKey) {
          throw new Error("issueKey is required");
        }
        if (!targetType) {
          throw new Error("targetType is required (MISSION or TODO)");
        }
        if (targetType === "TODO" && !args?.missionId) {
          throw new Error("missionId is required when targetType is TODO");
        }
        result = await client.importJiraIssue(
          workspaceId,
          issueKey,
          targetType,
          args?.missionId as string,
          args?.orderIndex as number
        );
        break;
      }

      case "threadcast_jira_import_epic": {
        const workspaceId = args?.workspaceId as string;
        const epicKey = args?.epicKey as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        if (!epicKey) {
          throw new Error("epicKey is required");
        }
        result = await client.importJiraEpic(
          workspaceId,
          epicKey,
          args?.includeChildren !== false,
          args?.issueTypes as string[],
          args?.includeCompleted === true
        );
        break;
      }

      case "threadcast_jira_list_mappings": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.getJiraMappings(workspaceId);
        break;
      }

      case "threadcast_jira_unlink": {
        const mappingId = args?.mappingId as string;
        if (!mappingId) {
          throw new Error("mappingId is required");
        }
        result = await client.unlinkJiraMapping(mappingId);
        break;
      }

      // ==================== PM Agent ====================
      case "threadcast_pm_agent_register": {
        const workspaceId = args?.workspaceId as string;
        const machineId = args?.machineId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        if (!machineId) {
          throw new Error("machineId is required");
        }
        result = await client.registerPmAgent(
          workspaceId,
          machineId,
          args?.label as string,
          args?.agentVersion as string
        );
        break;
      }

      case "threadcast_pm_agent_disconnect": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.disconnectPmAgent(workspaceId);
        break;
      }

      case "threadcast_pm_agent_heartbeat": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.pmAgentHeartbeat(
          workspaceId,
          args?.currentTodoId as string,
          args?.currentTodoTitle as string,
          args?.activeTodoCount as number
        );
        break;
      }

      case "threadcast_pm_agent_status": {
        const workspaceId = args?.workspaceId as string;
        if (!workspaceId) {
          throw new Error("workspaceId is required");
        }
        result = await client.getPmAgentStatus(workspaceId);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource Definitions
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "threadcast://missions",
        name: "ThreadCast Missions",
        description: "List of all missions in the default workspace",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://todos",
        name: "ThreadCast Todos",
        description: "List of all todos",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://questions",
        name: "ThreadCast AI Questions",
        description: "Pending AI questions waiting for answers",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://timeline",
        name: "ThreadCast Timeline",
        description: "Recent activity timeline",
        mimeType: "application/json",
      },
    ],
  };
});

// Read Resource Handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    let data: unknown;

    switch (uri) {
      case "threadcast://missions":
        data = await client.listMissions(getWorkspaceId());
        break;
      case "threadcast://todos":
        data = await client.listTodos();
        break;
      case "threadcast://questions":
        data = await client.listAIQuestions(getWorkspaceId());
        break;
      case "threadcast://timeline":
        data = await client.getTimeline(getWorkspaceId(), 50);
        break;
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

// Start Server
async function main() {
  // Auto-login on startup
  const loggedIn = await client.autoLogin();
  if (loggedIn) {
    console.error("ThreadCast: Auto-authenticated successfully");
  } else {
    console.error("ThreadCast: Running without authentication - use threadcast_login tool");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ThreadCast MCP server started");
}

main().catch(console.error);
