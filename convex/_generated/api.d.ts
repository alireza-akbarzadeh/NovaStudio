/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as chat from "../chat.js";
import type * as collab from "../collab.js";
import type * as comments from "../comments.js";
import type * as contact from "../contact.js";
import type * as deploy from "../deploy.js";
import type * as deployActions from "../deployActions.js";
import type * as github from "../github.js";
import type * as githubActions from "../githubActions.js";
import type * as githubBlame from "../githubBlame.js";
import type * as githubBranches from "../githubBranches.js";
import type * as githubCi from "../githubCi.js";
import type * as githubHistory from "../githubHistory.js";
import type * as githubImport from "../githubImport.js";
import type * as githubImportMutations from "../githubImportMutations.js";
import type * as githubInit from "../githubInit.js";
import type * as githubInitMutations from "../githubInitMutations.js";
import type * as githubIssues from "../githubIssues.js";
import type * as githubPull from "../githubPull.js";
import type * as githubPullMutations from "../githubPullMutations.js";
import type * as githubPullRequests from "../githubPullRequests.js";
import type * as githubPush from "../githubPush.js";
import type * as githubPushMutations from "../githubPushMutations.js";
import type * as githubRepos from "../githubRepos.js";
import type * as integrationActions from "../integrationActions.js";
import type * as integrations from "../integrations.js";
import type * as lib_accessibleProjects from "../lib/accessibleProjects.js";
import type * as lib_blogSeed from "../lib/blogSeed.js";
import type * as lib_createNotification from "../lib/createNotification.js";
import type * as lib_deploy from "../lib/deploy.js";
import type * as lib_extensionIds from "../lib/extensionIds.js";
import type * as lib_gitBranchName from "../lib/gitBranchName.js";
import type * as lib_github from "../lib/github.js";
import type * as lib_githubFetch from "../lib/githubFetch.js";
import type * as lib_githubProjectAccess from "../lib/githubProjectAccess.js";
import type * as lib_importProjectFiles from "../lib/importProjectFiles.js";
import type * as lib_linear from "../lib/linear.js";
import type * as lib_netlify from "../lib/netlify.js";
import type * as lib_notion from "../lib/notion.js";
import type * as lib_projectAccess from "../lib/projectAccess.js";
import type * as lib_projectFileContents from "../lib/projectFileContents.js";
import type * as lib_projectFileSearchIndex from "../lib/projectFileSearchIndex.js";
import type * as lib_projectFiles from "../lib/projectFiles.js";
import type * as lib_projectTemplates from "../lib/projectTemplates.js";
import type * as lib_recordActivity from "../lib/recordActivity.js";
import type * as lib_searchInContent from "../lib/searchInContent.js";
import type * as lib_threeWayMerge from "../lib/threeWayMerge.js";
import type * as lib_vercel from "../lib/vercel.js";
import type * as lib_webhookIntegrations from "../lib/webhookIntegrations.js";
import type * as linear from "../linear.js";
import type * as linearActions from "../linearActions.js";
import type * as notion from "../notion.js";
import type * as notionActions from "../notionActions.js";
import type * as presence from "../presence.js";
import type * as projectFiles from "../projectFiles.js";
import type * as projectMergeConflicts from "../projectMergeConflicts.js";
import type * as projectSearch from "../projectSearch.js";
import type * as projectStashes from "../projectStashes.js";
import type * as projects from "../projects.js";
import type * as pushSend from "../pushSend.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as sharing from "../sharing.js";
import type * as userExtensions from "../userExtensions.js";
import type * as userPreferences from "../userPreferences.js";
import type * as waitlist from "../waitlist.js";
import type * as workspace from "../workspace.js";
import type * as workspaceActions from "../workspaceActions.js";
import type * as workspaceFocus from "../workspaceFocus.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blog: typeof blog;
  chat: typeof chat;
  collab: typeof collab;
  comments: typeof comments;
  contact: typeof contact;
  deploy: typeof deploy;
  deployActions: typeof deployActions;
  github: typeof github;
  githubActions: typeof githubActions;
  githubBlame: typeof githubBlame;
  githubBranches: typeof githubBranches;
  githubCi: typeof githubCi;
  githubHistory: typeof githubHistory;
  githubImport: typeof githubImport;
  githubImportMutations: typeof githubImportMutations;
  githubInit: typeof githubInit;
  githubInitMutations: typeof githubInitMutations;
  githubIssues: typeof githubIssues;
  githubPull: typeof githubPull;
  githubPullMutations: typeof githubPullMutations;
  githubPullRequests: typeof githubPullRequests;
  githubPush: typeof githubPush;
  githubPushMutations: typeof githubPushMutations;
  githubRepos: typeof githubRepos;
  integrationActions: typeof integrationActions;
  integrations: typeof integrations;
  "lib/accessibleProjects": typeof lib_accessibleProjects;
  "lib/blogSeed": typeof lib_blogSeed;
  "lib/createNotification": typeof lib_createNotification;
  "lib/deploy": typeof lib_deploy;
  "lib/extensionIds": typeof lib_extensionIds;
  "lib/gitBranchName": typeof lib_gitBranchName;
  "lib/github": typeof lib_github;
  "lib/githubFetch": typeof lib_githubFetch;
  "lib/githubProjectAccess": typeof lib_githubProjectAccess;
  "lib/importProjectFiles": typeof lib_importProjectFiles;
  "lib/linear": typeof lib_linear;
  "lib/netlify": typeof lib_netlify;
  "lib/notion": typeof lib_notion;
  "lib/projectAccess": typeof lib_projectAccess;
  "lib/projectFileContents": typeof lib_projectFileContents;
  "lib/projectFileSearchIndex": typeof lib_projectFileSearchIndex;
  "lib/projectFiles": typeof lib_projectFiles;
  "lib/projectTemplates": typeof lib_projectTemplates;
  "lib/recordActivity": typeof lib_recordActivity;
  "lib/searchInContent": typeof lib_searchInContent;
  "lib/threeWayMerge": typeof lib_threeWayMerge;
  "lib/vercel": typeof lib_vercel;
  "lib/webhookIntegrations": typeof lib_webhookIntegrations;
  linear: typeof linear;
  linearActions: typeof linearActions;
  notion: typeof notion;
  notionActions: typeof notionActions;
  presence: typeof presence;
  projectFiles: typeof projectFiles;
  projectMergeConflicts: typeof projectMergeConflicts;
  projectSearch: typeof projectSearch;
  projectStashes: typeof projectStashes;
  projects: typeof projects;
  pushSend: typeof pushSend;
  pushSubscriptions: typeof pushSubscriptions;
  sharing: typeof sharing;
  userExtensions: typeof userExtensions;
  userPreferences: typeof userPreferences;
  waitlist: typeof waitlist;
  workspace: typeof workspace;
  workspaceActions: typeof workspaceActions;
  workspaceFocus: typeof workspaceFocus;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
