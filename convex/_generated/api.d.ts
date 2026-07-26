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
import type * as githubBranches from "../githubBranches.js";
import type * as githubHistory from "../githubHistory.js";
import type * as githubImport from "../githubImport.js";
import type * as githubImportMutations from "../githubImportMutations.js";
import type * as githubInit from "../githubInit.js";
import type * as githubInitMutations from "../githubInitMutations.js";
import type * as githubPull from "../githubPull.js";
import type * as githubPullMutations from "../githubPullMutations.js";
import type * as githubPush from "../githubPush.js";
import type * as githubPushMutations from "../githubPushMutations.js";
import type * as githubRepos from "../githubRepos.js";
import type * as lib_accessibleProjects from "../lib/accessibleProjects.js";
import type * as lib_blogSeed from "../lib/blogSeed.js";
import type * as lib_createNotification from "../lib/createNotification.js";
import type * as lib_deploy from "../lib/deploy.js";
import type * as lib_extensionIds from "../lib/extensionIds.js";
import type * as lib_github from "../lib/github.js";
import type * as lib_githubFetch from "../lib/githubFetch.js";
import type * as lib_importProjectFiles from "../lib/importProjectFiles.js";
import type * as lib_netlify from "../lib/netlify.js";
import type * as lib_projectAccess from "../lib/projectAccess.js";
import type * as lib_projectFiles from "../lib/projectFiles.js";
import type * as lib_projectTemplates from "../lib/projectTemplates.js";
import type * as lib_recordActivity from "../lib/recordActivity.js";
import type * as lib_vercel from "../lib/vercel.js";
import type * as presence from "../presence.js";
import type * as projectFiles from "../projectFiles.js";
import type * as projects from "../projects.js";
import type * as pushSend from "../pushSend.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as sharing from "../sharing.js";
import type * as userExtensions from "../userExtensions.js";
import type * as userPreferences from "../userPreferences.js";
import type * as waitlist from "../waitlist.js";
import type * as workspace from "../workspace.js";
import type * as workspaceActions from "../workspaceActions.js";

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
  githubBranches: typeof githubBranches;
  githubHistory: typeof githubHistory;
  githubImport: typeof githubImport;
  githubImportMutations: typeof githubImportMutations;
  githubInit: typeof githubInit;
  githubInitMutations: typeof githubInitMutations;
  githubPull: typeof githubPull;
  githubPullMutations: typeof githubPullMutations;
  githubPush: typeof githubPush;
  githubPushMutations: typeof githubPushMutations;
  githubRepos: typeof githubRepos;
  "lib/accessibleProjects": typeof lib_accessibleProjects;
  "lib/blogSeed": typeof lib_blogSeed;
  "lib/createNotification": typeof lib_createNotification;
  "lib/deploy": typeof lib_deploy;
  "lib/extensionIds": typeof lib_extensionIds;
  "lib/github": typeof lib_github;
  "lib/githubFetch": typeof lib_githubFetch;
  "lib/importProjectFiles": typeof lib_importProjectFiles;
  "lib/netlify": typeof lib_netlify;
  "lib/projectAccess": typeof lib_projectAccess;
  "lib/projectFiles": typeof lib_projectFiles;
  "lib/projectTemplates": typeof lib_projectTemplates;
  "lib/recordActivity": typeof lib_recordActivity;
  "lib/vercel": typeof lib_vercel;
  presence: typeof presence;
  projectFiles: typeof projectFiles;
  projects: typeof projects;
  pushSend: typeof pushSend;
  pushSubscriptions: typeof pushSubscriptions;
  sharing: typeof sharing;
  userExtensions: typeof userExtensions;
  userPreferences: typeof userPreferences;
  waitlist: typeof waitlist;
  workspace: typeof workspace;
  workspaceActions: typeof workspaceActions;
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
