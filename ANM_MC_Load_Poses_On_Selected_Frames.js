/*	
	MC Load Poses On Selected Frames v1.0
	
	On each selected frame, this script reads the Master Controller's current position and then load the pose that corresponds to the position.
	You can load poses from Master Controller rigs created with Interporation Grid and Slider Wizards.
	
	This script is basically mcPoint2dInterpolation.js and mcInterpolationSlider.js being repurposed.
	The two script above and their helper library are written by (C) 2017-2019 Toon Boom Animation Inc.
	
	
	Compatibility:
	
	Tested on Harmony Premium 16.0.3 and 17.0.0. 
	MC rigs made in Harmony 15 are not supported.
	Also this script has a compatibility issue when load a Harmony 17 MC rig on Harmony 16 and then try to use this script to load poses.
	MC rig made in Harmony 16 seem to work fine on Harmony 17 with this script.

	
	Installation:
	
	1) Download and Unarchive the zip file.
	2) Locate to your user scripts folder (a hidden folder):
	   https://docs.toonboom.com/help/harmony-17/premium/scripting/import-script.html	

	3) Add all unzipped files (*.js, *.ui and script-icons folder) directly to the folder above.	
	4) Add ANM_MC_Load_Poses_On_Selected_Frames to any toolbar.
	
	
	Direction:
	
	1) Select Master Controller node(s) or its parent group.
	2) Run ANM_MC_Load_Poses_on_Selected_Frames.	
	3) If no nodes are selected, script will make a list of all Master Controllers in the scene.
	4) On the Master Controller List, check ones to load poses from.
	5) Set a frame range for the script to process by selecting frame(s) in Timeline view.
	   The selection does not need to include actual member nodes that the selected Master Controller controls.
	6) Push Load Poses button.
	7) You can also use Show MC button to show the control widget of the checked Master Controller in Camera view.
	
	
	Required Scripts:
	
	This script relies on the library of Harmony 16/17's Interpolation Slider/Grid scripts, which comes with the standard Harmony Premium software. 
	
	
	Coder:

	Yu Ueda (raindropmoment.com)		
*/


function ANM_MC_Load_Poses_On_Selected_Frames()
{
	var pf = new privateFunctions;	

	var softwareVer = pf.getSoftwareVer();		
	if (softwareVer < 16)
	{
		MessageBox.information("This script only supports Toon Boom Harmony 16 and up.");
		return;
	}
	
	var localPath = specialFolders.userScripts + "/ANM_MC_Load_Poses_On_Selected_Frames.ui";
	this.ui = UiLoader.load(localPath);
	this.CBList = {};
	
	this.refreshMC = function()
	{		
		// clear scrollArea and CBList first		
		var scrollArea = this.ui.listBox.scrollArea.widget();		
		var size = Object.keys(this.CBList).length;			
		for (var n = 0; n < size; n++)
		{
			var curCB = this.CBList[n].CB;
			curCB.hide();			
			scrollArea.layout().removeWidget(curCB);
			delete this.CBList[n];
		}	

		var foundMCNodes = [];
		var checkItem;
		
		// find MC. If nodes selected, look in selection. else, list up all MC in the scene
		if (selection.numberOfNodesSelected() == 0)
			foundMCNodes = node.getNodes(["MasterController"]);
		else
		{
			var sNodes = pf.expandSelectionWithSubNodes(selection.selectedNodes());
			for (var n in sNodes)
			{
				if (node.type(sNodes[n]) == "MasterController")
				{
					foundMCNodes.push(sNodes[n]);
					checkItem = true;
				}
			}
			if (foundMCNodes.length <= 0)
				foundMCNodes = node.getNodes(["MasterController"]);
		}
		
		if (foundMCNodes.length <= 0)
		{
			scrollArea.scrollAreaLabel.show();
			this.ui.loadButton.enabled = false;
			this.ui.showButton.enabled = false;			
		}
		// create check boxes for each found MC node then add to scrollArea
		// also check boxes of all nodes if they were found inside the selection
		else
		{
			scrollArea.scrollAreaLabel.hide();	
			for (var m = 0; m < foundMCNodes.length; m++)
			{
				var curMC = foundMCNodes[m];		
				var CB = new QCheckBox(curMC, scrollArea);
				scrollArea.layout().addWidget(CB, 5, Qt.AlignLeft);
				this.CBList[m] = {MC: curMC, CB: CB};
				CB.setChecked(checkItem);
			}
			this.ui.loadButton.enabled = true;	
			this.ui.showButton.enabled = true;				
		}
		scrollArea.update();	
	}

	this.loadButtonReleased = function()
	{
		scene.beginUndoRedoAccum("MC Load Poses on Selected Frames");	
		var size = Object.keys(this.CBList).length;		
		for (var n = 0; n < size; n++)
		{
			if (this.CBList[n].CB.checked)
				pf.junction(this.CBList[n].MC);
		}
		scene.endUndoRedoAccum();		
	}
	this.showButtonReleased = function()
	{
		var size = Object.keys(this.CBList).length;		
		for (var n = 0; n < size; n++)
		{
			if (softwareVer >= 17 && this.CBList[n].CB.checked)
				node.showControls(this.CBList[n].MC, true);
			else if (softwareVer < 17 && this.CBList[n].CB.checked)
			{
				selection.clearSelection();
				selection.addNodeToSelection(this.CBList[n].MC);
				Action.perform("onActionToggleControl()");
			}	
		}
	}		
	this.ui.listBox.reloadButton.released.connect(this, this.refreshMC);
	this.ui.loadButton.released.connect(this, this.loadButtonReleased);
	this.ui.showButton.released.connect(this, this.showButtonReleased);

	var imagePath = specialFolders.userScripts + "/script-icons";
	this.ui.listBox.reloadButton.icon = new QIcon(imagePath + "/ANM_MC_Load_Poses_On_Selected_Frames_refresh.png");
	this.ui.listBox.reloadButton.setIconSize(new QSize(28,28));	
	this.ui.loadButton.icon = new QIcon(imagePath + "/ANM_MC_Load_Poses_On_Selected_Frames_load.png");
	this.ui.loadButton.setIconSize(new QSize(50,22));	
	this.ui.showButton.icon = new QIcon(imagePath + "/ANM_MC_Load_Poses_On_Selected_Frames_Show.png");
	this.ui.showButton.setIconSize(new QSize(22,22));	

	
	this.refreshMC();
	this.ui.show();					
}
	
	


function privateFunctions()
{
	var stateLib        		 = require(specialFolders.resource +"/scripts/utilities/state/TB_StateManager.js");
	var stateGridUtilLib		 = require(specialFolders.resource +"/scripts/utilities/ui/interpolationGrid/TB_StateGridHelper.js");
	var interpolationCommonLib	 = require(specialFolders.resource +"/scripts/utilities/ui/TB_InterpolationCommonUtils.js");	


	this.getSoftwareVer = function()
	{
		var info = about.getVersionInfoStr();
		info = info.split(" ");
		return parseFloat(info[7]);
	}		
	
	
	this.expandSelectionWithSubNodes = function(_sNodes)
	{
		var foundNodes = [];			
		for (var i = 0; i < _sNodes.length; i++)
		{
			if (node.type(_sNodes[i]) == "GROUP")
			{
				var subsNodes = this.expandSelectionWithSubNodes(node.subNodes(_sNodes[i]));
				foundNodes.push.apply(foundNodes, subsNodes);
			}
			else
				foundNodes.push(_sNodes[i]);
		}
		return(foundNodes);			
	}
	
	
	this.junction = function(MCNode)
	{		
		var startFrame = Timeline.firstFrameSel;
		var endFrame = startFrame + Timeline.numFrameSel -1;
		var MCType = null;
		
		var uiScriptAttr = node.getTextAttr(MCNode, 1, "uiScript.editor");
		if (uiScriptAttr.indexOf("mcInterpolationSlider") !== -1)
			MCType = "interpolationSlider";
		
		else if (uiScriptAttr.indexOf("mcPoint2dInterpolation") !== -1)	
			MCType = "interpolationGrid";
		
		else
		{
			MessageLog.trace("Load_Poses_On_Selected_Frames:\n" + MCNode + "is not a master controller supported by this script.");
			return;
		}

		if (MCType !== null)
		{	
			var uiDataAttr = node.getTextAttr(MCNode, fr, "uiData");		
			var uiData = JSON.parse(uiDataAttr);
			
			var states = this.loadStateFiles(MCNode, MCType, uiData);
			if (states == null)
			{
				MessageLog.trace(translator.tr("Load_Poses_On_Selected_Frames: Failed to load data."));
				return;
			}
			
			for (var fr = startFrame; fr <= endFrame; fr++)
			{					
				if (MCType == "interpolationSlider")
					this.loadPoseFromSlider(MCNode, states, fr);
				
				else if (MCType == "interpolationGrid")
					this.loadPoseFromGrid(MCNode, states, fr);
			}
		}
	}
	
	
	// shared function between mcInterpolationSlider.js and mcPoint2dInterpolation.js, restructured
	this.loadStateFiles = function(MCNode, MCType, uiData)
	{
		var states = null;
	  
		function onPreferredLocChanged(newLocation)
		{
			uiData.location = newLocation;
			uiDataAttr.setValue(JSON.stringify(uiData));
		}	
		function onStateFileLoaded(loadedStates)
		{
			if (loadedStates.length>0)
			{
				if (MCType == "interpolationSlider")
					states = loadedStates;
				else if (MCType == "interpolationGrid")
					states = stateGridUtilLib.loadStatesGrid(loadedStates);
			}
		}
		// utilities/ui/TB_InterpolationCommonUtils.js ::loadMCStateFiles()
		interpolationCommonLib.loadMCStateFiles(MCNode,
												stateLib,
												[uiData.poses],  //e.g. "/scripts/test1.tbState"
												uiData.location, //location key, e.g. "scn"
												onPreferredLocChanged,
												onStateFileLoaded);
		return states;
	}	

	
	// utilities/ui/interpolationSlider/mcInterpolationSlider.js, restructured
	this.loadPoseFromSlider = function(MCNode, states, fr)
	{
		var N_POSES = states.length;
		
		var sliderVal = node.getAttr(MCNode, fr, "widget_val").doubleValue();
		if (node.getAttr(MCNode, fr, "invert").boolValue() == true)
			sliderVal = 100 -sliderVal;
		
		var isContinuous = node.getAttr(MCNode, fr, "interpolate_poses").boolValue();		
		if (!isContinuous)
		{
			var stepVal = 100 /(N_POSES -1);
			sliderVal = Math.round(sliderVal /stepVal) *stepVal;
		}		
		
		var fIndex = (sliderVal/100) *(N_POSES -1);			
		var ia = Math.floor(fIndex);
		var ib = Math.ceil(fIndex);		
		var a = (ib -fIndex);
		var poseA = states[ia]; 	
		var poseB = states[ib];

		// utilities/TB_BilinearInterpolator.js ::TB_BilinearInterpolator.interpolate()
		var interpolatedPose = poseA.interpolate(1 -a, poseB);
		
		// utilities/state/TB_State.js ::TB_ScriptedState.applyState()	
		interpolatedPose.applyState(fr);
		Action.performForEach("onActionInvalidateCanvas","cameraView");		
	}
	
	
	// utilities/ui/interpolationGrid/mcPoint2dInterpolation.js, restructured
	this.loadPoseFromGrid = function(MCNode, states, fr)
	{				
		var isSeparate = node.getAttr(MCNode, 1, "widgetpos.separate").boolValue();	
		var u, v = 0;	
		if (isSeparate)
		{
			u = node.getAttr(MCNode, fr, "widgetpos.y").doubleValue();	
			v = node.getAttr(MCNode, fr, "widgetpos.x").doubleValue();
		}
		else
		{
			var pt2d = node.getTextAttr(MCNode, fr, "widgetpos.attr2dpoint");
			var pt2dSplit = pt2d.split(" ");
			u = parseFloat(pt2dSplit[1]);				
			v = parseFloat(pt2dSplit[0]);
		}				

		var interpolatedState = states.interpolate(u, v);
		interpolatedState.applyState(fr);
		Action.performForEach("onActionInvalidateCanvas","cameraView");
	}
}