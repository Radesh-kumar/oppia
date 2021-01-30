// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Story update service.
 */

import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { StoryUpdateService } from 'domain/story/story-update.service.ts';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service.ts';

describe('Story update service', function() {
  var storyObjectFactory:StoryObjectFactory = null;
  var sus:StoryUpdateService = null;
  var undoRedoService:UndoRedoService = null;
  var _sampleStory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    sus = TestBed.inject(StoryUpdateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    storyObjectFactory = TestBed.inject(StoryObjectFactory);

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'url',
      meta_tag_content: 'meta'
    };

    _sampleStory = storyObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
  });

  it('should add/remove a prerequisite skill id to/from a node in the story',
    () => {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      sus.addPrerequisiteSkillIdToNode(
        _sampleStory, 'node_1', 'skill_3');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1', 'skill_3']);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for adding a prerequisite ' +
    'skill id to a node',
  function() {
    sus.addPrerequisiteSkillIdToNode(
      _sampleStory, 'node_1', 'skill_3');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: ['skill_1', 'skill_3'],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove an acquired skill id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      sus.addAcquiredSkillIdToNode(
        _sampleStory, 'node_1', 'skill_4');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2', 'skill_4']);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for adding an acquired ' +
    'skill id to a node',
  function() {
    sus.addAcquiredSkillIdToNode(
      _sampleStory, 'node_1', 'skill_4');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: ['skill_2', 'skill_4'],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove a destination node id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
      sus.addDestinationNodeIdToNode(
        _sampleStory, 'node_1', 'node_2');

      // Adding an invalid destination node id should throw an error.
      expect(function() {
        sus.addDestinationNodeIdToNode(
          _sampleStory, 'node_1', 'node_5');
      }).toThrowError('The destination node with given id doesn\'t exist');

      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual(['node_2']);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
    }
  );

  it('should create a proper backend change dict for adding a destination ' +
    'node id to a node',
  function() {
    sus.addDestinationNodeIdToNode(
      _sampleStory, 'node_1', 'node_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: ['node_2'],
      old_value: [],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a prerequisite skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      sus.removePrerequisiteSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_1');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual([]);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for removing a prerequisite ' +
    'skill id from a node',
  function() {
    sus.removePrerequisiteSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: [],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add an acquired skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      sus.removeAcquiredSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_2');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual([]);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for removing an acquired ' +
    'skill id from a node',
  function() {
    sus.removeAcquiredSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: [],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a destination node id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
      sus.removeDestinationNodeIdFromNode(
        _sampleStory, 'node_2', 'node_1');

      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual([]);

      undoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
    }
  );

  it('should create a proper backend change dict for removing a destination ' +
    'node id from a node',
  function() {
    sus.removeDestinationNodeIdFromNode(
      _sampleStory, 'node_2', 'node_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: [],
      old_value: ['node_1'],
      node_id: 'node_2'
    }]);
  });

  it('should add/remove a story node', function() {
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    sus.addStoryNode(_sampleStory, 'Title 2');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(3);
    expect(_sampleStory.getStoryContents().getNextNodeId()).toEqual('node_4');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getId()).toEqual('node_3');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getTitle()).toEqual(
      'Title 2');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
  });

  it('should create a proper backend change dict for adding a story node',
    function() {
      sus.addStoryNode(_sampleStory, 'Title 2');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_story_node',
        node_id: 'node_3',
        title: 'Title 2'
      }]);
    }
  );

  it('should remove/add a story node', function() {
    expect(function() {
      sus.deleteStoryNode(_sampleStory, 'node_2');
    }).toThrowError('Cannot delete initial story node');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);
    sus.deleteStoryNode(_sampleStory, 'node_1');
    // Initial node should not be deleted.
    sus.deleteStoryNode(_sampleStory, 'node_2');
    expect(_sampleStory.getStoryContents().getInitialNodeId()).toEqual(null);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(0);

    expect(function() {
      undoRedoService.undoChange(_sampleStory);
    }).toThrowError('A deleted story node cannot be restored.');
  });

  it('should create a proper backend change dict for removing a story node',
    function() {
      sus.deleteStoryNode(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_story_node',
        node_id: 'node_1'
      }]);
    }
  );

  it('should finalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
    sus.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(true);

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
  });

  it('should create a proper backend change dict for finalizing a node outline',
    function() {
      sus.finalizeStoryNodeOutline(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_outline_status',
        new_value: true,
        old_value: false,
        node_id: 'node_1'
      }]);
    }
  );

  it('should unfinalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
    sus.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(false);

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
  });

  it('should create a proper backend change dict for unfinalizing a node ' +
    'outline', function() {
    sus.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_outline_status',
      new_value: false,
      old_value: true,
      node_id: 'node_2'
    }]);
  });

  it('should set a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
    sus.setStoryNodeOutline(
      _sampleStory, 'node_1', 'new outline');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('new outline');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
  });

  it('should create a proper backend change dict for setting a node outline',
    function() {
      sus.setStoryNodeOutline(
        _sampleStory, 'node_1', 'new outline');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'outline',
        new_value: 'new outline',
        old_value: 'Outline',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set a story node title', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
    sus.setStoryNodeTitle(
      _sampleStory, 'node_1', 'new title');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('new title');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
  });

  it('should create a proper backend change dict for setting a node title',
    function() {
      sus.setStoryNodeTitle(
        _sampleStory, 'node_1', 'new title');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title 1',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set a story node description', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
    sus.setStoryNodeDescription(
      _sampleStory, 'node_1', 'new description');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('new description');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getDescription()
    ).toBe('Description 1');
  });

  it('should create a backend change dict for setting a node description',
    function() {
      sus.setStoryNodeDescription(
        _sampleStory, 'node_1', 'new description');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Description 1',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set the exploration id of a story node', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
    sus.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_2');

    // Adding an already existing exploration in the story should throw an
    // error.
    expect(function() {
      sus.setStoryNodeExplorationId(
        _sampleStory, 'node_1', 'exp_1');
    }).toThrowError('The given exploration already exists in the story.');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
  });

  it('should create a proper backend change dict for setting the exploration ' +
    'id of a node', function() {
    sus.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'exploration_id',
      new_value: 'exp_2',
      old_value: null,
      node_id: 'node_1'
    }]);
  });

  it('should set/unset the initial node of the story', function() {
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
    sus.setInitialNodeId(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_1');

    undoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
  });

  it('should create a proper backend change dict for setting initial node',
    function() {
      sus.setInitialNodeId(_sampleStory, 'node_1');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_contents_property',
        property_name: 'initial_node_id',
        new_value: 'node_1',
        old_value: 'node_2'
      }]);
    }
  );

  it('should set/unset changes to a story\'s title', function() {
    expect(_sampleStory.getTitle()).toEqual('Story title');
    sus.setStoryTitle(_sampleStory, 'new title');
    expect(_sampleStory.getTitle()).toEqual('new title');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getTitle()).toEqual('Story title');
  });

  it('should create a proper backend change dict for changing title',
    function() {
      sus.setStoryTitle(_sampleStory, 'new title');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Story title'
      }]);
    }
  );

  it('should set/unset changes to a story\'s description', function() {
    expect(_sampleStory.getDescription()).toEqual('Story description');
    sus.setStoryDescription(_sampleStory, 'new description');
    expect(_sampleStory.getDescription()).toEqual('new description');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getDescription()).toEqual('Story description');
  });

  it('should create a proper backend change dict for changing descriptions',
    function() {
      sus.setStoryDescription(_sampleStory, 'new description');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Story description'
      }]);
    }
  );

  it('should set/unset changes to a story\'s notes', function() {
    expect(_sampleStory.getNotes()).toEqual('Story notes');
    sus.setStoryNotes(_sampleStory, 'new notes');
    expect(_sampleStory.getNotes()).toEqual('new notes');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getNotes()).toEqual('Story notes');
  });

  it('should create a proper backend change dict for changing notes',
    function() {
      sus.setStoryNotes(_sampleStory, 'new notes');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'notes',
        new_value: 'new notes',
        old_value: 'Story notes'
      }]);
    }
  );

  it('should set/unset changes to a story\'s language code', function() {
    expect(_sampleStory.getLanguageCode()).toEqual('en');
    sus.setStoryLanguageCode(_sampleStory, 'fi');
    expect(_sampleStory.getLanguageCode()).toEqual('fi');

    undoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      sus.setStoryLanguageCode(_sampleStory, 'fi');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );
});
