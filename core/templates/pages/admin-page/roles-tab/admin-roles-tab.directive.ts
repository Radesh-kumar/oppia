// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the Roles tab in the admin panel.
 */

require('pages/admin-page/roles-tab/role-graph.directive.ts');

require('domain/admin/admin-backend-api.service');
require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminRolesTab', [
  '$rootScope', 'AdminBackendApiService',
  'AdminDataService', 'AdminTaskManagerService',
  'LanguageUtilService', 'UrlInterpolationService',
  'ACTION_REMOVE_ALL_REVIEW_RIGHTS', 'ACTION_REMOVE_SPECIFIC_REVIEW_RIGHTS',
  'REVIEW_CATEGORY_QUESTION',
  'REVIEW_CATEGORY_TRANSLATION', 'REVIEW_CATEGORY_VOICEOVER',
  'USER_FILTER_CRITERION_ROLE', 'USER_FILTER_CRITERION_USERNAME',
  function(
      $rootScope, AdminBackendApiService,
      AdminDataService, AdminTaskManagerService,
      LanguageUtilService, UrlInterpolationService,
      ACTION_REMOVE_ALL_REVIEW_RIGHTS, ACTION_REMOVE_SPECIFIC_REVIEW_RIGHTS,
      REVIEW_CATEGORY_QUESTION,
      REVIEW_CATEGORY_TRANSLATION, REVIEW_CATEGORY_VOICEOVER,
      USER_FILTER_CRITERION_ROLE, USER_FILTER_CRITERION_USERNAME,) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/role-graph.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;

        var handleErrorResponse = function(errorResponse) {
          ctrl.setStatusMessage(
            'Server error: ' + errorResponse.error.error);
        };

        var getLanguageDescriptions = function(languageCodes) {
          var languageDescriptions = [];
          languageCodes.forEach(function(languageCode) {
            languageDescriptions.push(
              LanguageUtilService.getAudioLanguageDescription(
                languageCode));
          });
          return languageDescriptions;
        };

        ctrl.isLanguageSpecificReviewCategory = function(reviewCategory) {
          return (
            reviewCategory === REVIEW_CATEGORY_TRANSLATION ||
            reviewCategory === REVIEW_CATEGORY_VOICEOVER);
        };

        ctrl.submitRoleViewForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }

          ctrl.setStatusMessage('Processing query...');

          AdminTaskManagerService.startTask();
          ctrl.result = {};
          AdminBackendApiService.viewUsersRoleAsync(
            formResponse.filterCriterion, formResponse.role,
            formResponse.username
          ).then(function(response) {
            ctrl.result = response;
            if (Object.keys(ctrl.result).length === 0) {
              ctrl.resultRolesVisible = false;
              ctrl.setStatusMessage('No results.');
            } else {
              ctrl.resultRolesVisible = true;
              ctrl.setStatusMessage('Success.');
            }
            refreshFormData();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitUpdateRoleForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Updating User Role');
          AdminTaskManagerService.startTask();
          AdminBackendApiService.updateUserRoleAsync(
            formResponse.newRole, formResponse.username,
            formResponse.topicId
          ).then(function(response) {
            ctrl.setStatusMessage(
              'Role of ' + formResponse.username + ' successfully updated to ' +
              formResponse.newRole);
            refreshFormData();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitAddContributionReviewerForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Adding new reviewer...');
          AdminTaskManagerService.startTask();
          AdminBackendApiService.addContributionReviewerAsync(
            formResponse.category, formResponse.username,
            formResponse.languageCode
          ).then(function(response) {
            ctrl.setStatusMessage(
              'Successfully added "' + formResponse.username + '" as ' +
              formResponse.category + ' reviewer.');
            refreshFormData();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitViewContributionReviewersForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Processing query...');
          AdminTaskManagerService.startTask();
          if (formResponse.filterCriterion === USER_FILTER_CRITERION_ROLE) {
            AdminBackendApiService.viewContributionReviewersAsync(
              formResponse.category, formResponse.languageCode
            ).then(function(response) {
              ctrl.result.usernames = response.usernames;
              ctrl.contributionReviewersDataFetched = true;
              ctrl.setStatusMessage('Success.');
            }, handleErrorResponse);
          } else {
            var translationLanguages = [];
            var voiceoverLanguages = [];
            AdminBackendApiService.contributionReviewerRightsAsync(
              formResponse.username
            ).then(function(response) {
              translationLanguages = getLanguageDescriptions(
                response.can_review_translation_for_language_codes);
              voiceoverLanguages = getLanguageDescriptions(
                response.can_review_voiceover_for_language_codes);
              ctrl.result = {
                translationLanguages: translationLanguages,
                voiceoverLanguages: voiceoverLanguages,
                questions: response.can_review_questions
              };
              ctrl.contributionReviewersDataFetched = true;
              ctrl.setStatusMessage('Success.');
            }, handleErrorResponse);
          }
          AdminTaskManagerService.finishTask();
        };

        ctrl.submitRemoveContributionReviewerForm = function(formResponse) {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          ctrl.setStatusMessage('Processing query...');
          AdminTaskManagerService.startTask();
          AdminBackendApiService.removeContributionReviewerAsync(
            formResponse.username, formResponse.method,
            formResponse.category, formResponse.languageCode
          ).then(function(response) {
            ctrl.setStatusMessage('Success.');
            refreshFormData();
          }, handleErrorResponse);
          AdminTaskManagerService.finishTask();
        };

        var refreshFormData = function() {
          ctrl.formData = {
            viewUserRoles: {
              filterCriterion: USER_FILTER_CRITERION_ROLE,
              role: null,
              username: '',
              isValid: function() {
                if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
                  return Boolean(this.role);
                }
                if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
                  return Boolean(this.username);
                }
                return false;
              }
            },
            updateRole: {
              newRole: null,
              username: '',
              topicId: null,
              isValid: function() {
                if (this.newRole === 'TOPIC_MANAGER') {
                  return Boolean(this.topicId);
                } else if (this.newRole) {
                  return Boolean(this.username);
                }
                return false;
              }
            },
            viewContributionReviewers: {
              filterCriterion: USER_FILTER_CRITERION_ROLE,
              username: '',
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
                  if (this.category === null) {
                    return false;
                  }
                  if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                    return Boolean(this.languageCode);
                  }
                  return true;
                }

                if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
                  return Boolean(this.username);
                }
              }
            },
            addContributionReviewer: {
              username: '',
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.username === '') {
                  return false;
                }
                if (this.category === null) {
                  return false;
                }
                if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                  return Boolean(this.languageCode);
                }
                return true;
              }
            },
            removeContributionReviewer: {
              username: '',
              method: ACTION_REMOVE_ALL_REVIEW_RIGHTS,
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.username === '') {
                  return false;
                }
                if (this.method === ACTION_REMOVE_ALL_REVIEW_RIGHTS) {
                  return Boolean(this.username);
                } else {
                  if (this.category === null) {
                    return false;
                  }
                  if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                    return Boolean(this.languageCode);
                  }
                  return true;
                }
              }
            }
          };
        };

        ctrl.$onInit = function() {
          ctrl.ACTION_REMOVE_ALL_REVIEW_RIGHTS = (
            ACTION_REMOVE_ALL_REVIEW_RIGHTS);
          ctrl.ACTION_REMOVE_SPECIFIC_REVIEW_RIGHTS = (
            ACTION_REMOVE_SPECIFIC_REVIEW_RIGHTS);
          ctrl.USER_FILTER_CRITERION_USERNAME = USER_FILTER_CRITERION_USERNAME;
          ctrl.USER_FILTER_CRITERION_ROLE = USER_FILTER_CRITERION_ROLE;
          ctrl.UPDATABLE_ROLES = {};
          ctrl.VIEWABLE_ROLES = {};
          ctrl.REVIEW_CATEGORIES = {
            TRANSLATION: REVIEW_CATEGORY_TRANSLATION,
            VOICEOVER: REVIEW_CATEGORY_VOICEOVER,
            QUESTION: REVIEW_CATEGORY_QUESTION
          };
          refreshFormData();
          ctrl.resultRolesVisible = false;
          ctrl.contributionReviewersDataFetched = false;
          ctrl.result = {};
          ctrl.setStatusMessage('');

          ctrl.languageCodesAndDescriptions = (
            LanguageUtilService.getAllVoiceoverLanguageCodes().map(
              function(languageCode) {
                return {
                  id: languageCode,
                  description: (
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode))
                };
              }));
          ctrl.topicSummaries = {};
          ctrl.graphData = {};
          ctrl.graphDataLoaded = false;
          AdminDataService.getDataAsync().then(function(adminDataObject) {
            ctrl.UPDATABLE_ROLES = adminDataObject.updatableRoles;
            ctrl.VIEWABLE_ROLES = adminDataObject.viewableRoles;
            ctrl.topicSummaries = adminDataObject.topicSummaries;
            ctrl.graphData = adminDataObject.roleGraphData;

            ctrl.graphDataLoaded = false;
            // Calculating initStateId and finalStateIds for graphData
            // Since role graph is acyclic, node with no incoming edge
            // is initState and nodes with no outgoing edge are finalStates.
            var hasIncomingEdge = [];
            var hasOutgoingEdge = [];
            for (var i = 0; i < ctrl.graphData.links.length; i++) {
              hasIncomingEdge.push(ctrl.graphData.links[i].target);
              hasOutgoingEdge.push(ctrl.graphData.links[i].source);
            }
            var finalStateIds = [];
            for (var role in ctrl.graphData.nodes) {
              if (ctrl.graphData.nodes.hasOwnProperty(role)) {
                if (hasIncomingEdge.indexOf(role) === -1) {
                  ctrl.graphData.initStateId = role;
                }
                if (hasOutgoingEdge.indexOf(role) === -1) {
                  finalStateIds.push(role);
                }
              }
            }
            ctrl.graphData.finalStateIds = finalStateIds;
            ctrl.graphDataLoaded = true;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$apply();
          });
        };

        ctrl.clearReviewersData = function() {
          ctrl.contributionReviewersDataFetched = false;
          ctrl.result = {};
        };
      }]
    };
  }
]);
