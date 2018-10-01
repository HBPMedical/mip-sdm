/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  SoftwareDeliveryMachine,
  SoftwareDeliveryMachineConfiguration,
  whenPushSatisfies,
  DoNotSetAnyGoals,
  not,
  ToDefaultBranch,
} from "@atomist/sdm";
import {
  createSoftwareDeliveryMachine,
  summarizeGoalsInGitHubStatus,
  IsInLocalMode,
} from "@atomist/sdm-core";
import { HasCaptainBuildScriptFile } from "../mip/project-scripts/pushTests";
import { BuildGoals, LocalGoals, BuildReleaseGoals } from "./goals";
import { addTeamPolicies } from "./teamPolicies";
import { addCaptainSupport } from "./captainSupport";
import { addMipSupport } from "./mipSupport";

export function machine(
  configuration: SoftwareDeliveryMachineConfiguration,
): SoftwareDeliveryMachine {
  const sdm = createSoftwareDeliveryMachine(
    {
      name: "MIP Software Delivery Machine",
      configuration,
    },

    whenPushSatisfies(not(HasCaptainBuildScriptFile))
      .itMeans("Non Docker-built repository")
      .setGoals(DoNotSetAnyGoals),

    whenPushSatisfies(HasCaptainBuildScriptFile, IsInLocalMode)
      .itMeans("Docker-built repository in local mode")
      .setGoals(LocalGoals),

    // TODO: ignore projects in HBPMedical team that are already managed by another team
    // whenPushSatisfies(not(isSdmEnabled(configuration.name)), isTeam("T095SFFBK"))
    //      .itMeans("Node repository in atomist team that we are already building in atomist-community")
    //      .setGoals(DoNotSetAnyGoals),

    // TODO: check for immaterial changes
    // whenPushSatisfies(allSatisfied(IsNode, not(IsMaven)), not(MaterialChangeToNodeRepo))
    // .itMeans("No Material Change")
    // .setGoals(Immaterial),

    whenPushSatisfies(HasCaptainBuildScriptFile, ToDefaultBranch)
      .itMeans("Docker Release Build")
      .setGoals(BuildReleaseGoals),

    whenPushSatisfies(HasCaptainBuildScriptFile)
      .itMeans("Docker Build")
      .setGoals(BuildGoals),


    whenPushSatisfies(HasCaptainBuildScriptFile)
      .itMeans("Build")
      .setGoals(BuildGoals),
  );

  addCaptainSupport(sdm);
  addMipSupport(sdm);
  addTeamPolicies(sdm);
    
  sdm
    .addExtensionPacks
    // buildAwareCodeTransforms({
    //  issueRouter: {
    //    raiseIssue: async () => {
    //      /* intentionally left empty */
    //    },
    //  },
    // }),
    // SlocSupport,
    ();

  summarizeGoalsInGitHubStatus(sdm);

  return sdm;
}
