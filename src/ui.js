//
// ChemDoodle Web Components 7.0.1
//
// http://web.chemdoodle.com
//
// Copyright 2009-2015 iChemLabs, LLC.  All rights reserved.
//
// The ChemDoodle Web Components library is licensed under version 3
// of the GNU GENERAL PUBLIC LICENSE.
//
// You may redistribute it and/or modify it under the terms of the
// GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Please contact iChemLabs <http://www.ichemlabs.com/contact-us> for
// alternate licensing options.
//

//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
ChemDoodle.uis = (function() {
	'use strict';
	var p = {};

	p.actions = {};
	p.gui = {};
	p.gui.desktop = {};
	p.gui.mobile = {};
	p.states = {};
	p.tools = {};

	return p;

})();
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions) {
	'use strict';
	actions._Action = function() {
	};
	var _ = actions._Action.prototype;
	_.forward = function(sketcher) {
		this.innerForward();
		this.checks(sketcher);
	};
	_.reverse = function(sketcher) {
		this.innerReverse();
		this.checks(sketcher);
	};
	_.checks = function(sketcher) {
		for ( var i = 0, ii = sketcher.molecules.length; i < ii; i++) {
			sketcher.molecules[i].check();
		}
		if (sketcher.lasso && sketcher.lasso.isActive()) {
			sketcher.lasso.setBounds();
		}
		sketcher.repaint();
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(informatics, structures, actions) {
	'use strict';
	actions.AddAction = function(sketcher, a, as, bs) {
		this.sketcher = sketcher;
		this.a = a;
		this.as = as;
		this.bs = bs;
	};
	var _ = actions.AddAction.prototype = new actions._Action();
	_.innerForward = function() {
		var mol = this.sketcher.getMoleculeByAtom(this.a);
		if (!mol) {
			mol = new structures.Molecule();
			this.sketcher.molecules.push(mol);
		}
		if (this.as) {
			for ( var i = 0, ii = this.as.length; i < ii; i++) {
				mol.atoms.push(this.as[i]);
			}
		}
		if (this.bs) {
			var merging = [];
			for ( var i = 0, ii = this.bs.length; i < ii; i++) {
				var b = this.bs[i];
				if (mol.atoms.indexOf(b.a1) === -1) {
					var otherMol = this.sketcher.getMoleculeByAtom(b.a1);
					if (merging.indexOf(otherMol) === -1) {
						merging.push(otherMol);
					}
				}
				if (mol.atoms.indexOf(b.a2) === -1) {
					var otherMol = this.sketcher.getMoleculeByAtom(b.a2);
					if (merging.indexOf(otherMol) === -1) {
						merging.push(otherMol);
					}
				}
				mol.bonds.push(b);
			}
			for ( var i = 0, ii = merging.length; i < ii; i++) {
				var molRemoving = merging[i];
				this.sketcher.removeMolecule(molRemoving);
				mol.atoms = mol.atoms.concat(molRemoving.atoms);
				mol.bonds = mol.bonds.concat(molRemoving.bonds);
			}
		}
	};
	_.innerReverse = function() {
		var mol = this.sketcher.getMoleculeByAtom(this.a);
		if (this.as) {
			var aKeep = [];
			for ( var i = 0, ii = mol.atoms.length; i < ii; i++) {
				if (this.as.indexOf(mol.atoms[i]) === -1) {
					aKeep.push(mol.atoms[i]);
				}
			}
			mol.atoms = aKeep;
		}
		if (this.bs) {
			var bKeep = [];
			for ( var i = 0, ii = mol.bonds.length; i < ii; i++) {
				if (this.bs.indexOf(mol.bonds[i]) === -1) {
					bKeep.push(mol.bonds[i]);
				}
			}
			mol.bonds = bKeep;
		}
		if (mol.atoms.length === 0) {
			// remove molecule if it is empty
			this.sketcher.removeMolecule(mol);
		} else {
			var split = new informatics.Splitter().split(mol);
			if (split.length > 1) {
				this.sketcher.removeMolecule(mol);
				for ( var i = 0, ii = split.length; i < ii; i++) {
					this.sketcher.molecules.push(split[i]);
				}
			}
		}
	};

})(ChemDoodle.informatics, ChemDoodle.structures, ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions) {
	'use strict';
	actions.AddShapeAction = function(sketcher, s) {
		this.sketcher = sketcher;
		this.s = s;
	};
	var _ = actions.AddShapeAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.sketcher.shapes.push(this.s);
	};
	_.innerReverse = function() {
		this.sketcher.removeShape(this.s);
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions, Bond, m) {
	'use strict';
	actions.ChangeBondAction = function(b, orderAfter, stereoAfter) {
		this.b = b;
		this.orderBefore = b.bondOrder;
		this.stereoBefore = b.stereo;
		if (orderAfter) {
			this.orderAfter = orderAfter;
			this.stereoAfter = stereoAfter;
		} else {
			// make sure to floor so half bond types increment correctly
			this.orderAfter = m.floor(b.bondOrder + 1);
			if (this.orderAfter > 3) {
				this.orderAfter = 1;
			}
			this.stereoAfter = Bond.STEREO_NONE;
		}
	};
	var _ = actions.ChangeBondAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.b.bondOrder = this.orderAfter;
		this.b.stereo = this.stereoAfter;
	};
	_.innerReverse = function() {
		this.b.bondOrder = this.orderBefore;
		this.b.stereo = this.stereoBefore;
	};

})(ChemDoodle.uis.actions, ChemDoodle.structures.Bond, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions, m) {
	'use strict';
	actions.ChangeBracketAttributeAction = function(s, type) {
		this.s = s;
		this.type = type;
	};
	var _ = actions.ChangeBracketAttributeAction.prototype = new actions._Action();
	_.innerForward = function() {
		var c = this.type > 0 ? 1 : -1;
		switch (m.abs(this.type)) {
		case 1:
			this.s.charge += c;
			break;
		case 2:
			this.s.repeat += c;
			break;
		case 3:
			this.s.mult += c;
			break;
		}
	};
	_.innerReverse = function() {
		var c = this.type > 0 ? -1 : 1;
		switch (m.abs(this.type)) {
		case 1:
			this.s.charge += c;
			break;
		case 2:
			this.s.repeat += c;
			break;
		case 3:
			this.s.mult += c;
			break;
		}
	};

})(ChemDoodle.uis.actions, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeChargeAction = function(a, delta) {
		this.a = a;
		this.delta = delta;
	};
	var _ = actions.ChangeChargeAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.charge += this.delta;
	};
	_.innerReverse = function() {
		this.a.charge -= this.delta;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeCoordinatesAction = function(as, newCoords) {
		this.as = as;
		this.recs = [];
		for ( var i = 0, ii = this.as.length; i < ii; i++) {
			this.recs[i] = {
				'xo' : this.as[i].x,
				'yo' : this.as[i].y,
				'xn' : newCoords[i].x,
				'yn' : newCoords[i].y
			};
		}
	};
	var _ = actions.ChangeCoordinatesAction.prototype = new actions._Action();
	_.innerForward = function() {
		for ( var i = 0, ii = this.as.length; i < ii; i++) {
			this.as[i].x = this.recs[i].xn;
			this.as[i].y = this.recs[i].yn;
		}
	};
	_.innerReverse = function() {
		for ( var i = 0, ii = this.as.length; i < ii; i++) {
			this.as[i].x = this.recs[i].xo;
			this.as[i].y = this.recs[i].yo;
		}
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeLabelAction = function(a, after) {
		this.a = a;
		this.before = a.label;
		this.after = after;
	};
	var _ = actions.ChangeLabelAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.label = this.after;
	};
	_.innerReverse = function() {
		this.a.label = this.before;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeLonePairAction = function(a, delta) {
		this.a = a;
		this.delta = delta;
	};
	var _ = actions.ChangeLonePairAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.numLonePair += this.delta;
	};
	_.innerReverse = function() {
		this.a.numLonePair -= this.delta;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeQueryAction = function(o, after) {
		this.o = o;
		this.before = o.query;
		this.after = after;
	};
	var _ = actions.ChangeQueryAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.o.query = this.after;
	};
	_.innerReverse = function() {
		this.o.query = this.before;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeRadicalAction = function(a, delta) {
		this.a = a;
		this.delta = delta;
	};
	var _ = actions.ChangeRadicalAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.numRadical += this.delta;
	};
	_.innerReverse = function() {
		this.a.numRadical -= this.delta;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ChangeRgroupAction = function(a, rafter) {
		this.a = a;
		this.rbefore = a.rgroup;
		this.rafter = rafter;
	};
	var _ = actions.ChangeRgroupAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.rgroup = this.rafter;
	};
	_.innerReverse = function() {
		this.a.rgroup = this.rbefore;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(structures, actions) {
	'use strict';
	actions.ClearAction = function(sketcher) {
		this.sketcher = sketcher;
		this.beforeMols = this.sketcher.molecules;
		this.beforeShapes = this.sketcher.shapes;
		this.sketcher.clear();
		if (this.sketcher.oneMolecule && !this.sketcher.setupScene) {
			this.afterMol = new structures.Molecule();
			this.afterMol.atoms.push(new structures.Atom());
			this.sketcher.molecules.push(this.afterMol);
			this.sketcher.center();
			this.sketcher.repaint();
		}
	};
	var _ = actions.ClearAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.sketcher.molecules = [];
		this.sketcher.shapes = [];
		if (this.sketcher.oneMolecule && !this.sketcher.setupScene) {
			this.sketcher.molecules.push(this.afterMol);
		}
	};
	_.innerReverse = function() {
		this.sketcher.molecules = this.beforeMols;
		this.sketcher.shapes = this.beforeShapes;
	};

})(ChemDoodle.structures, ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.DeleteAction = function(sketcher, a, as, bs) {
		this.sketcher = sketcher;
		this.a = a;
		this.as = as;
		this.bs = bs;
		this.ss = [];
	};
	var _ = actions.DeleteAction.prototype = new actions._Action();
	_.innerForwardAReverse = actions.AddAction.prototype.innerReverse;
	_.innerReverseAForward = actions.AddAction.prototype.innerForward;
	_.innerForward = function() {
		this.innerForwardAReverse();
		for ( var i = 0, ii = this.ss.length; i < ii; i++) {
			this.sketcher.removeShape(this.ss[i]);
		}
	};
	_.innerReverse = function() {
		this.innerReverseAForward();
		if (this.ss.length > 0) {
			this.sketcher.shapes = this.sketcher.shapes.concat(this.ss);
		}
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(informatics, actions) {
	'use strict';
	actions.DeleteContentAction = function(sketcher, as, ss) {
		this.sketcher = sketcher;
		this.as = as;
		this.ss = ss;
		this.bs = [];
		for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
			var mol = this.sketcher.molecules[i];
			for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
				var b = mol.bonds[j];
				if (b.a1.isLassoed && b.a2.isLassoed) {
					this.bs.push(b);
				}
			}
		}
	};
	var _ = actions.DeleteContentAction.prototype = new actions._Action();
	_.innerForward = function() {
		for ( var i = 0, ii = this.ss.length; i < ii; i++) {
			this.sketcher.removeShape(this.ss[i]);
		}
		var asKeep = [];
		var bsKeep = [];
		for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
			var mol = this.sketcher.molecules[i];
			for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
				var a = mol.atoms[j];
				if (this.as.indexOf(a) === -1) {
					asKeep.push(a);
				}
			}
			for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
				var b = mol.bonds[j];
				if (this.bs.indexOf(b) === -1) {
					bsKeep.push(b);
				}
			}
		}
		this.sketcher.molecules = new informatics.Splitter().split({
			atoms : asKeep,
			bonds : bsKeep
		});
	};
	_.innerReverse = function() {
		this.sketcher.shapes = this.sketcher.shapes.concat(this.ss);
		var asKeep = [];
		var bsKeep = [];
		for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
			var mol = this.sketcher.molecules[i];
			asKeep = asKeep.concat(mol.atoms);
			bsKeep = bsKeep.concat(mol.bonds);
		}
		this.sketcher.molecules = new informatics.Splitter().split({
			atoms : asKeep.concat(this.as),
			bonds : bsKeep.concat(this.bs)
		});
	};

})(ChemDoodle.informatics, ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.DeleteShapeAction = function(sketcher, s) {
		this.sketcher = sketcher;
		this.s = s;
	};
	var _ = actions.DeleteShapeAction.prototype = new actions._Action();
	_.innerForward = actions.AddShapeAction.prototype.innerReverse;
	_.innerReverse = actions.AddShapeAction.prototype.innerForward;

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.FlipBondAction = function(b) {
		this.b = b;
	};
	var _ = actions.FlipBondAction.prototype = new actions._Action();
	_.innerForward = function() {
		var temp = this.b.a1;
		this.b.a1 = this.b.a2;
		this.b.a2 = temp;
	};
	_.innerReverse = function() {
		this.innerForward();
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.MoveAction = function(ps, dif) {
		this.ps = ps;
		this.dif = dif;
	};
	var _ = actions.MoveAction.prototype = new actions._Action();
	_.innerForward = function() {
		for ( var i = 0, ii = this.ps.length; i < ii; i++) {
			this.ps[i].add(this.dif);
		}
	};
	_.innerReverse = function() {
		for ( var i = 0, ii = this.ps.length; i < ii; i++) {
			this.ps[i].sub(this.dif);
		}
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(structures, actions) {
	'use strict';
	actions.NewMoleculeAction = function(sketcher, as, bs) {
		this.sketcher = sketcher;
		this.as = as;
		this.bs = bs;
	};
	var _ = actions.NewMoleculeAction.prototype = new actions._Action();
	_.innerForward = function() {
		var mol = new structures.Molecule();
		mol.atoms = mol.atoms.concat(this.as);
		mol.bonds = mol.bonds.concat(this.bs);
		mol.check();
		this.sketcher.addMolecule(mol);
	};
	_.innerReverse = function() {
		this.sketcher.removeMolecule(this.sketcher.getMoleculeByAtom(this.as[0]));
	};

})(ChemDoodle.structures, ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions, m) {
	'use strict';
	actions.RotateAction = function(ps, dif, center) {
		this.ps = ps;
		this.dif = dif;
		this.center = center;
	};
	var _ = actions.RotateAction.prototype = new actions._Action();
	_.innerForward = function() {
		for ( var i = 0, ii = this.ps.length; i < ii; i++) {
			var p = this.ps[i];
			var dist = this.center.distance(p);
			var angle = this.center.angle(p) + this.dif;
			p.x = this.center.x + dist * m.cos(angle);
			p.y = this.center.y - dist * m.sin(angle);
		}
	};
	_.innerReverse = function() {
		for ( var i = 0, ii = this.ps.length; i < ii; i++) {
			var p = this.ps[i];
			var dist = this.center.distance(p);
			var angle = this.center.angle(p) - this.dif;
			p.x = this.center.x + dist * m.cos(angle);
			p.y = this.center.y - dist * m.sin(angle);
		}
	};

})(ChemDoodle.uis.actions, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions) {
	'use strict';
	actions.SwitchContentAction = function(sketcher, mols, shapes) {
		this.sketcher = sketcher;
		this.beforeMols = this.sketcher.molecules;
		this.beforeShapes = this.sketcher.shapes;
		this.molsA = mols;
		this.shapesA = shapes;
	};
	var _ = actions.SwitchContentAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.sketcher.loadContent(this.molsA, this.shapesA);
	};
	_.innerReverse = function() {
		this.sketcher.molecules = this.beforeMols;
		this.sketcher.shapes = this.beforeShapes;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions) {
	'use strict';
	actions.SwitchMoleculeAction = function(sketcher, mol) {
		this.sketcher = sketcher;
		this.beforeMols = this.sketcher.molecules;
		this.beforeShapes = this.sketcher.shapes;
		this.molA = mol;
	};
	var _ = actions.SwitchMoleculeAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.sketcher.loadMolecule(this.molA);
	};
	_.innerReverse = function() {
		this.sketcher.molecules = this.beforeMols;
		this.sketcher.shapes = this.beforeShapes;
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions) {
	'use strict';
	actions.ToggleAnyAtomAction = function(a) {
		this.a = a;
	};
	var _ = actions.ToggleAnyAtomAction.prototype = new actions._Action();
	_.innerForward = function() {
		this.a.any = !this.a.any;
	};
	_.innerReverse = actions.ToggleAnyAtomAction.prototype.innerForward;

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions) {
	'use strict';
	actions.HistoryManager = function(sketcher) {
		this.sketcher = sketcher;
		this.undoStack = [];
		this.redoStack = [];
	};
	var _ = actions.HistoryManager.prototype;
	_.undo = function() {
		if (this.undoStack.length !== 0) {
			if (this.sketcher.lasso && this.sketcher.lasso.isActive()) {
				this.sketcher.lasso.empty();
			}
			var a = this.undoStack.pop();
			a.reverse(this.sketcher);
			this.redoStack.push(a);
			if (this.undoStack.length === 0) {
				this.sketcher.toolbarManager.buttonUndo.disable();
			}
			this.sketcher.toolbarManager.buttonRedo.enable();
		}
	};
	_.redo = function() {
		if (this.redoStack.length !== 0) {
			if (this.sketcher.lasso && this.sketcher.lasso.isActive()) {
				this.sketcher.lasso.empty();
			}
			var a = this.redoStack.pop();
			a.forward(this.sketcher);
			this.undoStack.push(a);
			this.sketcher.toolbarManager.buttonUndo.enable();
			if (this.redoStack.length === 0) {
				this.sketcher.toolbarManager.buttonRedo.disable();
			}
		}
	};
	_.pushUndo = function(a) {
		a.forward(this.sketcher);
		this.undoStack.push(a);
		if (this.redoStack.length !== 0) {
			this.redoStack = [];
		}
		this.sketcher.toolbarManager.buttonUndo.enable();
		this.sketcher.toolbarManager.buttonRedo.disable();
	};
	_.clear = function() {
		if (this.undoStack.length !== 0) {
			this.undoStack = [];
			this.sketcher.toolbarManager.buttonUndo.disable();
		}
		if (this.redoStack.length !== 0) {
			this.redoStack = [];
			this.sketcher.toolbarManager.buttonRedo.disable();
		}
	};

})(ChemDoodle.uis.actions);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(math, monitor, actions, states, structures, SYMBOLS, m) {
	'use strict';
	states._State = function() {
	};
	var _ = states._State.prototype;
	_.setup = function(sketcher) {
		this.sketcher = sketcher;
	};

	_.clearHover = function() {
		if (this.sketcher.hovering) {
			this.sketcher.hovering.isHover = false;
			this.sketcher.hovering.isSelected = false;
			this.sketcher.hovering = undefined;
		}
	};
	_.findHoveredObject = function(e, includeAtoms, includeBonds, includeShapes) {
		this.clearHover();
		var min = Infinity;
		var hovering;
		var hoverdist = this.sketcher.specs.bondLength_2D;
		if (!this.sketcher.isMobile) {
			hoverdist /= this.sketcher.specs.scale;
		}
		if (includeAtoms) {
			for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
				var mol = this.sketcher.molecules[i];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					var a = mol.atoms[j];
					a.isHover = false;
					var dist = e.p.distance(a);
					if (dist < hoverdist && dist < min) {
						min = dist;
						hovering = a;
					}
				}
			}
		}
		if (includeBonds) {
			for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
				var mol = this.sketcher.molecules[i];
				for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
					var b = mol.bonds[j];
					b.isHover = false;
					var dist = e.p.distance(b.getCenter());
					if (dist < hoverdist && dist < min) {
						min = dist;
						hovering = b;
					}
				}
			}
		}
		if (includeShapes) {
			for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
				var s = this.sketcher.shapes[i];
				s.isHover = false;
				s.hoverPoint = undefined;
				var sps = s.getPoints();
				for ( var j = 0, jj = sps.length; j < jj; j++) {
					var p = sps[j];
					var dist = e.p.distance(p);
					if (dist < hoverdist && dist < min) {
						min = dist;
						hovering = s;
						s.hoverPoint = p;
					}
				}
			}
			if (!hovering) {
				// find smallest shape pointer is over
				for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
					var s = this.sketcher.shapes[i];
					if (s.isOver(e.p, hoverdist)) {
						hovering = s;
					}
				}
			}
		}
		if (hovering) {
			hovering.isHover = true;
			this.sketcher.hovering = hovering;
		}
	};
	_.getOptimumAngle = function(a, order) {
		var mol = this.sketcher.getMoleculeByAtom(a);
		var angles = mol.getAngles(a);
		var angle = 0;
		if (angles.length === 0) {
			angle = m.PI / 6;
		} else if (angles.length === 1) {
			var b;
			for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
				if (mol.bonds[j].contains(this.sketcher.hovering)) {
					b = mol.bonds[j];
				}
			}
			if (b.bondOrder >= 3 || order>=3) {
				angle = angles[0] + m.PI;
			} else {
				var concerned = angles[0] % m.PI * 2;
				if (math.isBetween(concerned, 0, m.PI / 2) || math.isBetween(concerned, m.PI, 3 * m.PI / 2)) {
					angle = angles[0] + 2 * m.PI / 3;
				} else {
					angle = angles[0] - 2 * m.PI / 3;
				}
			}
		} else {
			// avoid inside rings
			var modded;
			for ( var j = 0, jj = mol.rings.length; j < jj; j++) {
				var r = mol.rings[j];
				if(r.atoms.indexOf(a)!==-1){
					angles.push(a.angle(r.getCenter()));
					modded = true;
				}
			}
			if(modded){
				angles.sort();
			}
			angle = math.angleBetweenLargest(angles).angle;
		}
		return angle;
	};
	_.removeStartAtom = function() {
		if (this.sketcher.startAtom) {
			this.sketcher.startAtom.x = -10;
			this.sketcher.startAtom.y = -10;
			this.sketcher.repaint();
		}
	};

	_.enter = function() {
		if (this.innerenter) {
			this.innerenter();
		}
	};
	_.exit = function() {
		if (this.innerexit) {
			this.innerexit();
		}
	};
	_.click = function(e) {
		if (this.innerclick) {
			this.innerclick(e);
		}
	};
	_.rightclick = function(e) {
		if (this.innerrightclick) {
			this.innerrightclick(e);
		}
	};
	_.dblclick = function(e) {
		if (this.innerdblclick) {
			this.innerdblclick(e);
		}
		if (!this.sketcher.hovering && this.sketcher.oneMolecule) {
			// center structure
			var dif = new structures.Point(this.sketcher.width / 2, this.sketcher.height / 2);
			var bounds = this.sketcher.getContentBounds();
			dif.x -= (bounds.maxX + bounds.minX) / 2;
			dif.y -= (bounds.maxY + bounds.minY) / 2;
			this.sketcher.historyManager.pushUndo(new actions.MoveAction(this.sketcher.getAllPoints(), dif));
		}
	};
	_.mousedown = function(e) {
		this.sketcher.lastPoint = e.p;
		// must also check for mobile hits here to the help button
		if (this.sketcher.isHelp || this.sketcher.isMobile && e.op.distance(new structures.Point(this.sketcher.width - 20, 20)) < 10) {
			this.sketcher.isHelp = false;
			this.sketcher.lastPoint = undefined;
			this.sketcher.repaint();
			window.open('http://web.chemdoodle.com/demos/sketcher');
		} else if (this.innermousedown) {
			this.innermousedown(e);
		}
	};
	_.rightmousedown = function(e) {
		if (this.innerrightmousedown) {
			this.innerrightmousedown(e);
		}
	};
	_.mousemove = function(e) {
		if (this.innermousemove) {
			this.innermousemove(e);
		}
		// call the repaint here to repaint the help button, also this is called
		// by other functions, so the repaint must be here
		this.sketcher.repaint();
	};
	_.mouseout = function(e) {
		if (this.innermouseout) {
			this.innermouseout(e);
		}
		if (this.sketcher.isHelp) {
			this.sketcher.isHelp = false;
			this.sketcher.repaint();
		}
		if (this.sketcher.hovering && monitor.CANVAS_DRAGGING != this.sketcher) {
			this.sketcher.hovering = undefined;
			this.sketcher.repaint();
		}
	};
	_.mouseover = function(e) {
		if (this.innermouseover) {
			this.innermouseover(e);
		}
	};
	_.mouseup = function(e) {
		this.parentAction = undefined;
		if (this.innermouseup) {
			this.innermouseup(e);
		}
	};
	_.rightmouseup = function(e) {
		if (this.innerrightmouseup) {
			this.innerrightmouseup(e);
		}
	};
	_.mousewheel = function(e, delta) {
		if (this.innermousewheel) {
			this.innermousewheel(e);
		}
		this.sketcher.specs.scale += delta / 50;
		this.sketcher.checkScale();
		this.sketcher.repaint();
	};
	_.drag = function(e) {
		if (this.innerdrag) {
			this.innerdrag(e);
		}
		if (!this.sketcher.hovering && this !== this.sketcher.stateManager.STATE_LASSO && this !== this.sketcher.stateManager.STATE_SHAPE && this !== this.sketcher.stateManager.STATE_PUSHER) {
			if (monitor.SHIFT) {
				// rotate structure
				if (this.parentAction) {
					var center = this.parentAction.center;
					var oldAngle = center.angle(this.sketcher.lastPoint);
					var newAngle = center.angle(e.p);
					var rot = newAngle - oldAngle;
					this.parentAction.dif += rot;
					for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
						var a = this.parentAction.ps[i];
						var dist = center.distance(a);
						var angle = center.angle(a) + rot;
						a.x = center.x + dist * m.cos(angle);
						a.y = center.y - dist * m.sin(angle);
					}
					// must check here as change is outside of an action
					for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
						this.sketcher.molecules[i].check();
					}
				} else {
					var center = new structures.Point(this.sketcher.width / 2, this.sketcher.height / 2);
					var oldAngle = center.angle(this.sketcher.lastPoint);
					var newAngle = center.angle(e.p);
					var rot = newAngle - oldAngle;
					this.parentAction = new actions.RotateAction(this.sketcher.getAllPoints(), rot, center);
					this.sketcher.historyManager.pushUndo(this.parentAction);
				}
			} else {
				if (!this.sketcher.lastPoint) {
					// this prevents the structure from being rotated and
					// translated at the same time while a gesture is occuring,
					// which is preferable based on use cases since the rotation
					// center is the canvas center
					return;
				}
				// move structure
				var dif = new structures.Point(e.p.x, e.p.y);
				dif.sub(this.sketcher.lastPoint);
				if (this.parentAction) {
					this.parentAction.dif.add(dif);
					for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
						this.parentAction.ps[i].add(dif);
					}
					if (this.sketcher.lasso && this.sketcher.lasso.isActive()) {
						this.sketcher.lasso.bounds.minX += dif.x;
						this.sketcher.lasso.bounds.maxX += dif.x;
						this.sketcher.lasso.bounds.minY += dif.y;
						this.sketcher.lasso.bounds.maxY += dif.y;
					}
					// must check here as change is outside of an action
					for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
						this.sketcher.molecules[i].check();
					}
				} else {
					this.parentAction = new actions.MoveAction(this.sketcher.getAllPoints(), dif);
					this.sketcher.historyManager.pushUndo(this.parentAction);
				}
			}
			this.sketcher.repaint();
		}
		this.sketcher.lastPoint = e.p;
	};
	_.keydown = function(e) {
		if (monitor.CANVAS_DRAGGING === this.sketcher) {
			if (this.sketcher.lastPoint) {
				e.p = this.sketcher.lastPoint;
				this.drag(e);
			}
		} else if (monitor.META) {
			if (e.which === 90) {
				// z
				this.sketcher.historyManager.undo();
			} else if (e.which === 89) {
				// y
				this.sketcher.historyManager.redo();
			} else if (e.which === 83) {
				// s
				this.sketcher.toolbarManager.buttonSave.getElement().click();
			} else if (e.which === 79) {
				// o
				this.sketcher.toolbarManager.buttonOpen.getElement().click();
			} else if (e.which === 78) {
				// n
				this.sketcher.toolbarManager.buttonClear.getElement().click();
			} else if (e.which === 187 || e.which === 61) {
				// +
				this.sketcher.toolbarManager.buttonScalePlus.getElement().click();
			} else if (e.which === 189 || e.which === 109) {
				// -
				this.sketcher.toolbarManager.buttonScaleMinus.getElement().click();
			} else if (e.which === 65) {
				// a
				if (!this.sketcher.oneMolecule) {
					this.sketcher.toolbarManager.buttonLasso.getElement().click();
					this.sketcher.lasso.select(this.sketcher.getAllAtoms(), this.sketcher.shapes);
				}
			}
		} else if (e.which === 9) {
			// tab
			if (!this.sketcher.oneMolecule) {
				this.sketcher.lasso.block = true;
				this.sketcher.toolbarManager.buttonLasso.getElement().click();
				this.sketcher.lasso.block = false;
				if (monitor.SHIFT) {
					if (this.sketcher.shapes.length > 0) {
						var nextShapeIndex = this.sketcher.shapes.length - 1;
						if (this.sketcher.lasso.shapes.length > 0) {
							nextShapeIndex = this.sketcher.shapes.indexOf(this.sketcher.lasso.shapes[0]) + 1;
						}
						if (nextShapeIndex === this.sketcher.shapes.length) {
							nextShapeIndex = 0;
						}
						// have to manually empty because shift modifier key
						// is down
						this.sketcher.lasso.empty();
						this.sketcher.lasso.select([], [ this.sketcher.shapes[nextShapeIndex] ]);
					}
				} else {
					if (this.sketcher.molecules.length > 0) {
						var nextMolIndex = this.sketcher.molecules.length - 1;
						if (this.sketcher.lasso.atoms.length > 0) {
							var curMol = this.sketcher.getMoleculeByAtom(this.sketcher.lasso.atoms[0]);
							nextMolIndex = this.sketcher.molecules.indexOf(curMol) + 1;
						}
						if (nextMolIndex === this.sketcher.molecules.length) {
							nextMolIndex = 0;
						}
						this.sketcher.lasso.select(this.sketcher.molecules[nextMolIndex].atoms, []);
					}
				}
			}
		} else if (e.which === 32) {
			// space key
			if (this.sketcher.lasso) {
				this.sketcher.lasso.empty();
			}
			this.sketcher.toolbarManager.buttonSingle.getElement().click();
		} else if (e.which >= 37 && e.which <= 40) {
			// arrow keys
			var dif = new structures.Point();
			switch (e.which) {
			case 37:
				dif.x = -10;
				break;
			case 38:
				dif.y = -10;
				break;
			case 39:
				dif.x = 10;
				break;
			case 40:
				dif.y = 10;
				break;
			}
			this.sketcher.historyManager.pushUndo(new actions.MoveAction(this.sketcher.lasso && this.sketcher.lasso.isActive() ? this.sketcher.lasso.getAllPoints() : this.sketcher.getAllPoints(), dif));
		} else if (e.which === 187 || e.which === 189 || e.which === 61 || e.which === 109) {
			// plus or minus
			if (this.sketcher.hovering && this.sketcher.hovering instanceof structures.Atom) {
				this.sketcher.historyManager.pushUndo(new actions.ChangeChargeAction(this.sketcher.hovering, e.which === 187 || e.which === 61 ? 1 : -1));
			}
		} else if (e.which === 8 || e.which === 127) {
			// delete or backspace
			this.sketcher.stateManager.STATE_ERASE.handleDelete();
		} else if (e.which >= 48 && e.which <= 57) {
			// digits
			if (this.sketcher.hovering) {
				var number = e.which - 48;
				var molIdentifier;
				var as = [];
				var bs = [];
				if (this.sketcher.hovering instanceof structures.Atom) {
					molIdentifier = this.sketcher.hovering;
					if (monitor.SHIFT) {
						if (number > 2 && number < 9) {
							var mol = this.sketcher.getMoleculeByAtom(this.sketcher.hovering);
							var angles = mol.getAngles(this.sketcher.hovering);
							var angle = 3 * m.PI / 2;
							if (angles.length !== 0) {
								angle = math.angleBetweenLargest(angles).angle;
							}
							var ring = this.sketcher.stateManager.STATE_NEW_RING.getRing(this.sketcher.hovering, number, this.sketcher.specs.bondLength_2D, angle, false);
							if (mol.atoms.indexOf(ring[0]) === -1) {
								as.push(ring[0]);
							}
							if (!this.sketcher.bondExists(this.sketcher.hovering, ring[0])) {
								bs.push(new structures.Bond(this.sketcher.hovering, ring[0]));
							}
							for ( var i = 1, ii = ring.length; i < ii; i++) {
								if (mol.atoms.indexOf(ring[i]) === -1) {
									as.push(ring[i]);
								}
								if (!this.sketcher.bondExists(ring[i - 1], ring[i])) {
									bs.push(new structures.Bond(ring[i - 1], ring[i]));
								}
							}
							if (!this.sketcher.bondExists(ring[ring.length - 1], this.sketcher.hovering)) {
								bs.push(new structures.Bond(ring[ring.length - 1], this.sketcher.hovering));
							}
						}
					} else {
						if (number === 0) {
							number = 10;
						}
						var p = new structures.Point(this.sketcher.hovering.x, this.sketcher.hovering.y);
						var a = this.getOptimumAngle(this.sketcher.hovering);
						var prev = this.sketcher.hovering;
						for ( var k = 0; k < number; k++) {
							var ause = a + (k % 2 === 1 ? m.PI / 3 : 0);
							p.x += this.sketcher.specs.bondLength_2D * m.cos(ause);
							p.y -= this.sketcher.specs.bondLength_2D * m.sin(ause);
							var use = new structures.Atom('C', p.x, p.y);
							var minDist = Infinity;
							var closest;
							for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
								var mol = this.sketcher.molecules[i];
								for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
									var at = mol.atoms[j];
									var dist = at.distance(use);
									if (dist < minDist) {
										minDist = dist;
										closest = at;
									}
								}
							}
							if (minDist < 5) {
								use = closest;
							} else {
								as.push(use);
							}
							if (!this.sketcher.bondExists(prev, use)) {
								bs.push(new structures.Bond(prev, use));
							}
							prev = use;
						}
					}
				} else if (this.sketcher.hovering instanceof structures.Bond) {
					molIdentifier = this.sketcher.hovering.a1;
					if (monitor.SHIFT) {
						if (number > 2 && number < 9) {
							var ring = this.sketcher.stateManager.STATE_NEW_RING.getOptimalRing(this.sketcher.hovering, number);
							var start = this.sketcher.hovering.a2;
							var end = this.sketcher.hovering.a1;
							var mol = this.sketcher.getMoleculeByAtom(start);
							if (ring[0] === this.sketcher.hovering.a1) {
								start = this.sketcher.hovering.a1;
								end = this.sketcher.hovering.a2;
							}
							if (mol.atoms.indexOf(ring[1]) === -1) {
								as.push(ring[1]);
							}
							if (!this.sketcher.bondExists(start, ring[1])) {
								bs.push(new structures.Bond(start, ring[1]));
							}
							for ( var i = 2, ii = ring.length; i < ii; i++) {
								if (mol.atoms.indexOf(ring[i]) === -1) {
									as.push(ring[i]);
								}
								if (!this.sketcher.bondExists(ring[i - 1], ring[i])) {
									bs.push(new structures.Bond(ring[i - 1], ring[i]));
								}
							}
							if (!this.sketcher.bondExists(ring[ring.length - 1], end)) {
								bs.push(new structures.Bond(ring[ring.length - 1], end));
							}
						}
					} else if (number > 0 && number < 4 && this.sketcher.hovering.bondOrder !== number) {
						this.sketcher.historyManager.pushUndo(new actions.ChangeBondAction(this.sketcher.hovering, number, structures.Bond.STEREO_NONE));
					} else if (number === 7 || number === 8) {
						var stereo = structures.Bond.STEREO_RECESSED;
						if(number===7){
							stereo = structures.Bond.STEREO_PROTRUDING;
						}
						this.sketcher.historyManager.pushUndo(new actions.ChangeBondAction(this.sketcher.hovering, 1, stereo));
					}
				}
				if (as.length !== 0 || bs.length !== 0) {
					this.sketcher.historyManager.pushUndo(new actions.AddAction(this.sketcher, molIdentifier, as, bs));
				}
			}
		} else if (e.which >= 65 && e.which <= 90) {
			// alphabet
			if (this.sketcher.hovering) {
				if (this.sketcher.hovering instanceof structures.Atom) {
					var check = String.fromCharCode(e.which);
					var firstMatch;
					var firstAfterMatch;
					var found = false;
					for ( var j = 0, jj = SYMBOLS.length; j < jj; j++) {
						if (this.sketcher.hovering.label.charAt(0) === check) {
							if (SYMBOLS[j] === this.sketcher.hovering.label) {
								found = true;
							} else if (SYMBOLS[j].charAt(0) === check) {
								if (found && !firstAfterMatch) {
									firstAfterMatch = SYMBOLS[j];
								} else if (!firstMatch) {
									firstMatch = SYMBOLS[j];
								}
							}
						} else {
							if (SYMBOLS[j].charAt(0) === check) {
								firstMatch = SYMBOLS[j];
								break;
							}
						}
					}
					var use = 'C';
					if (firstAfterMatch) {
						use = firstAfterMatch;
					} else if (firstMatch) {
						use = firstMatch;
					}
					if (use !== this.sketcher.hovering.label) {
						this.sketcher.historyManager.pushUndo(new actions.ChangeLabelAction(this.sketcher.hovering, use));
					}
				} else if (this.sketcher.hovering instanceof structures.Bond) {
					if (e.which === 70) {
						// f
						this.sketcher.historyManager.pushUndo(new actions.FlipBondAction(this.sketcher.hovering));
					}
				}
			}
		}
		if (this.innerkeydown) {
			this.innerkeydown(e);
		}
	};
	_.keypress = function(e) {
		if (this.innerkeypress) {
			this.innerkeypress(e);
		}
	};
	_.keyup = function(e) {
		if (monitor.CANVAS_DRAGGING === this.sketcher) {
			if (this.sketcher.lastPoint) {
				e.p = this.sketcher.lastPoint;
				this.sketcher.drag(e);
			}
		}
		if (this.innerkeyup) {
			this.innerkeyup(e);
		}
	};

})(ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, ChemDoodle.SYMBOLS, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions, states) {
	'use strict';
	states.ChargeState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.ChargeState.prototype = new states._State();
	_.delta = 1;
	_.innermouseup = function(e) {
		if (this.sketcher.hovering) {
			this.sketcher.historyManager.pushUndo(new actions.ChangeChargeAction(this.sketcher.hovering, this.delta));
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, false);
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions, states, structures, d2) {
	'use strict';
	states.EraseState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.EraseState.prototype = new states._State();
	_.handleDelete = function() {
		if (this.sketcher.lasso && this.sketcher.lasso.isActive()) {
			this.sketcher.historyManager.pushUndo(new actions.DeleteContentAction(this.sketcher, this.sketcher.lasso.atoms, this.sketcher.lasso.shapes));
			this.sketcher.lasso.empty();
		} else if (this.sketcher.hovering) {
			if (this.sketcher.hovering instanceof structures.Atom) {
				if (this.sketcher.oneMolecule) {
					var mol = this.sketcher.molecules[0];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						mol.atoms[j].visited = false;
					}
					var connectionsA = [];
					var connectionsB = [];
					this.sketcher.hovering.visited = true;
					for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
						var bj = mol.bonds[j];
						if (bj.contains(this.sketcher.hovering)) {
							var atoms = [];
							var bonds = [];
							var q = new structures.Queue();
							q.enqueue(bj.getNeighbor(this.sketcher.hovering));
							while (!q.isEmpty()) {
								var a = q.dequeue();
								if (!a.visited) {
									a.visited = true;
									atoms.push(a);
									for ( var k = 0, kk = mol.bonds.length; k < kk; k++) {
										var bk = mol.bonds[k];
										if (bk.contains(a) && !bk.getNeighbor(a).visited) {
											q.enqueue(bk.getNeighbor(a));
											bonds.push(bk);
										}
									}
								}
							}
							connectionsA.push(atoms);
							connectionsB.push(bonds);
						}
					}
					var largest = -1;
					var index = -1;
					for ( var j = 0, jj = connectionsA.length; j < jj; j++) {
						if (connectionsA[j].length > largest) {
							index = j;
							largest = connectionsA[j].length;
						}
					}
					if (index > -1) {
						var as = [];
						var bs = [];
						var hold;
						for ( var i = 0, ii = mol.atoms.length; i < ii; i++) {
							var a = mol.atoms[i];
							if (connectionsA[index].indexOf(a) === -1) {
								as.push(a);
							} else if (!hold) {
								hold = a;
							}
						}
						for ( var i = 0, ii = mol.bonds.length; i < ii; i++) {
							var b = mol.bonds[i];
							if (connectionsB[index].indexOf(b) === -1) {
								bs.push(b);
							}
						}
						this.sketcher.historyManager.pushUndo(new actions.DeleteAction(this.sketcher, hold, as, bs));
					} else {
						this.sketcher.historyManager.pushUndo(new actions.ClearAction(this.sketcher));
					}
				} else {
					var mol = this.sketcher.getMoleculeByAtom(this.sketcher.hovering);
					this.sketcher.historyManager.pushUndo(new actions.DeleteAction(this.sketcher, mol.atoms[0], [ this.sketcher.hovering ], mol.getBonds(this.sketcher.hovering)));
				}
			} else if (this.sketcher.hovering instanceof structures.Bond) {
				if (!this.sketcher.oneMolecule || this.sketcher.hovering.ring) {
					this.sketcher.historyManager.pushUndo(new actions.DeleteAction(this.sketcher, this.sketcher.hovering.a1, undefined, [ this.sketcher.hovering ]));
				}
			} else if (this.sketcher.hovering instanceof d2._Shape) {
				this.sketcher.historyManager.pushUndo(new actions.DeleteShapeAction(this.sketcher, this.sketcher.hovering));
			}
			this.sketcher.hovering = undefined;
			this.sketcher.repaint();
		}
		for ( var i = this.sketcher.shapes.length - 1; i >= 0; i--) {
			var s = this.sketcher.shapes[i];
			if (s instanceof d2.Pusher) {
				var remains1 = false, remains2 = false;
				for ( var j = 0, jj = this.sketcher.molecules.length; j < jj; j++) {
					var mol = this.sketcher.molecules[j];
					for ( var k = 0, kk = mol.atoms.length; k < kk; k++) {
						var a = mol.atoms[k];
						if (a === s.o1) {
							remains1 = true;
						} else if (a === s.o2) {
							remains2 = true;
						}
					}
					for ( var k = 0, kk = mol.bonds.length; k < kk; k++) {
						var b = mol.bonds[k];
						if (b === s.o1) {
							remains1 = true;
						} else if (b === s.o2) {
							remains2 = true;
						}
					}
				}
				if (!remains1 || !remains2) {
					this.sketcher.historyManager.undoStack[this.sketcher.historyManager.undoStack.length - 1].ss.push(s);
					this.sketcher.removeShape(s);
				}
			}
		}
	};
	_.innermouseup = function(e) {
		this.handleDelete();
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, true, true);
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, ChemDoodle.structures.d2);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(monitor, structures, actions, states, m) {
	'use strict';
	states.LabelState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.LabelState.prototype = new states._State();
	_.label = 'C';
	_.innermousedown = function(e) {
		this.newMolAllowed = true;
		if(this.sketcher.hovering){
			this.sketcher.hovering.isHover = false;
			this.sketcher.hovering.isSelected = true;
			this.sketcher.repaint();
		}
	};
	_.innermouseup = function(e) {
		if (this.sketcher.hovering) {
			this.sketcher.hovering.isSelected = false;
			if(this.sketcher.tempAtom){
				var b = new structures.Bond(this.sketcher.hovering, this.sketcher.tempAtom);
				this.sketcher.historyManager.pushUndo(new actions.AddAction(this.sketcher, b.a1, [b.a2], [b]));
				this.sketcher.tempAtom = undefined;
			}else if (this.label !== this.sketcher.hovering.label) {
				this.sketcher.historyManager.pushUndo(new actions.ChangeLabelAction(this.sketcher.hovering, this.label));
			}
		} else if (!this.sketcher.oneMolecule && this.newMolAllowed) {
			this.sketcher.historyManager.pushUndo(new actions.NewMoleculeAction(this.sketcher, [ new structures.Atom(this.label, e.p.x, e.p.y) ], []));
		}
		if (!this.sketcher.isMobile) {
			this.mousemove(e);
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, false);
	};
	_.innerdrag = function(e) {
		this.newMolAllowed = false;
		if(this.sketcher.hovering){
			var dist = this.sketcher.hovering.distance(e.p);
			if(dist<9){
				this.sketcher.tempAtom = undefined;
			}else if (e.p.distance(this.sketcher.hovering) < 15) {
				var angle = this.getOptimumAngle(this.sketcher.hovering);
				var x = this.sketcher.hovering.x + this.sketcher.specs.bondLength_2D * m.cos(angle);
				var y = this.sketcher.hovering.y - this.sketcher.specs.bondLength_2D * m.sin(angle);
				this.sketcher.tempAtom = new structures.Atom(this.label, x, y, 0);
			} else {
				if (monitor.ALT && monitor.SHIFT) {
					this.sketcher.tempAtom = new structures.Atom(this.label, e.p.x, e.p.y, 0);
				} else {
					var angle = this.sketcher.hovering.angle(e.p);
					var length = this.sketcher.hovering.distance(e.p);
					if (!monitor.SHIFT) {
						length = this.sketcher.specs.bondLength_2D;
					}
					if (!monitor.ALT) {
						var increments = m.floor((angle + m.PI / 12) / (m.PI / 6));
						angle = increments * m.PI / 6;
					}
					this.sketcher.tempAtom = new structures.Atom(this.label, this.sketcher.hovering.x + length * m.cos(angle), this.sketcher.hovering.y - length * m.sin(angle), 0);
				}
			}
			this.sketcher.repaint();
		}
	};

})(ChemDoodle.monitor, ChemDoodle.structures, ChemDoodle.uis.actions, ChemDoodle.uis.states, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(math, monitor, structures, d2, actions, states, tools, m) {
	'use strict';
	states.LassoState = function(sketcher) {
		this.setup(sketcher);
	};
	var TRANSLATE = 1;
	var ROTATE = 2;
	//var SCALE = 3;
	var transformType = TRANSLATE;
	var paintRotate = false;

	var _ = states.LassoState.prototype = new states._State();
	_.innerdrag = function(e) {
		this.inDrag = true;
		if (this.sketcher.lasso.isActive() && transformType) {
			if (!this.sketcher.lastPoint) {
				// this prevents the structure from being rotated and
				// translated at the same time while a gesture is occurring,
				// which is preferable based on use cases since the rotation
				// center is the canvas center
				return;
			}
			if (transformType === TRANSLATE) {
				// move selection
				var dif = new structures.Point(e.p.x, e.p.y);
				dif.sub(this.sketcher.lastPoint);
				if (this.parentAction) {
					this.parentAction.dif.add(dif);
					for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
						this.parentAction.ps[i].add(dif);
					}
					// must check here as change is outside of an action
					for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
						this.sketcher.molecules[i].check();
					}
					this.sketcher.lasso.bounds.minX += dif.x;
					this.sketcher.lasso.bounds.maxX += dif.x;
					this.sketcher.lasso.bounds.minY += dif.y;
					this.sketcher.lasso.bounds.maxY += dif.y;
					this.sketcher.repaint();
				} else {
					this.parentAction = new actions.MoveAction(this.sketcher.lasso.getAllPoints(), dif);
					this.sketcher.historyManager.pushUndo(this.parentAction);
				}
			} else if (transformType === ROTATE) {
				// rotate structure
				if (this.parentAction) {
					var center = this.parentAction.center;
					var oldAngle = center.angle(this.sketcher.lastPoint);
					var newAngle = center.angle(e.p);
					var rot = newAngle - oldAngle;
					this.parentAction.dif += rot;
					for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
						var a = this.parentAction.ps[i];
						var dist = center.distance(a);
						var angle = center.angle(a) + rot;
						a.x = center.x + dist * m.cos(angle);
						a.y = center.y - dist * m.sin(angle);
					}
					// must check here as change is outside of an action
					for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
						this.sketcher.molecules[i].check();
					}
					this.sketcher.lasso.setBounds();
					this.sketcher.repaint();
				} else {
					var center = new structures.Point((this.sketcher.lasso.bounds.minX + this.sketcher.lasso.bounds.maxX) / 2, (this.sketcher.lasso.bounds.minY + this.sketcher.lasso.bounds.maxY) / 2);
					var oldAngle = center.angle(this.sketcher.lastPoint);
					var newAngle = center.angle(e.p);
					var rot = newAngle - oldAngle;
					this.parentAction = new actions.RotateAction(this.sketcher.lasso.getAllPoints(), rot, center);
					this.sketcher.historyManager.pushUndo(this.parentAction);
				}
			}
		} else if (this.sketcher.hovering) {
			if (!this.sketcher.lastPoint) {
				// this prevents the structure from being rotated and
				// translated at the same time while a gesture is occurring,
				// which is preferable based on use cases since the rotation
				// center is the canvas center
				return;
			}
			// move structure
			var dif = new structures.Point(e.p.x, e.p.y);
			dif.sub(this.sketcher.lastPoint);
			if (!this.parentAction) {
				var ps;
				if (this.sketcher.hovering instanceof structures.Atom) {
					ps = monitor.SHIFT ? [ this.sketcher.hovering ] : this.sketcher.getMoleculeByAtom(this.sketcher.hovering).atoms;
				} else if (this.sketcher.hovering instanceof structures.Bond) {
					ps = [ this.sketcher.hovering.a1, this.sketcher.hovering.a2 ];
				} else if (this.sketcher.hovering instanceof d2._Shape) {
					ps = this.sketcher.hovering.hoverPoint ? [ this.sketcher.hovering.hoverPoint ] : this.sketcher.hovering.getPoints();
				}
				this.parentAction = new actions.MoveAction(ps, dif);
				this.sketcher.historyManager.pushUndo(this.parentAction);
			} else {
				this.parentAction.dif.add(dif);
				for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
					this.parentAction.ps[i].add(dif);
				}
				// must check here as change is outside of an action
				for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
					this.sketcher.molecules[i].check();
				}
				this.sketcher.repaint();
			}
		} else {
			// must check against undefined as lastGestureRotate can be 0, in
			// mobile mode it is set during gestures, don't use lasso
			this.sketcher.lasso.addPoint(e.p);
			this.sketcher.repaint();
		}
	};
	_.innermousedown = function(e) {
		this.inDrag = false;
		if (this.sketcher.lasso.isActive() && !monitor.SHIFT) {
			transformType = undefined;
			var rotateBuffer = 25 / this.sketcher.specs.scale;
			if (math.isBetween(e.p.x, this.sketcher.lasso.bounds.minX, this.sketcher.lasso.bounds.maxX) && math.isBetween(e.p.y, this.sketcher.lasso.bounds.minY, this.sketcher.lasso.bounds.maxY)) {
				transformType = TRANSLATE;
			} else if (math.isBetween(e.p.x, this.sketcher.lasso.bounds.minX - rotateBuffer, this.sketcher.lasso.bounds.maxX + rotateBuffer) && math.isBetween(e.p.y, this.sketcher.lasso.bounds.minY - rotateBuffer, this.sketcher.lasso.bounds.maxY + rotateBuffer)) {
				transformType = ROTATE;
			}
		} else if (!this.sketcher.hovering) {
			this.sketcher.lastPoint = undefined;
			this.sketcher.lasso.addPoint(e.p);
			this.sketcher.repaint();
		}
	};
	_.innermouseup = function(e) {
		if (!transformType) {
			if (!this.sketcher.hovering) {
				this.sketcher.lasso.select();
			}
		}
		this.innermousemove(e);
	};
	_.innerclick = function(e) {
		if (!transformType && !this.inDrag) {
			if (this.sketcher.hovering) {
				var as = [];
				var ss = [];
				if (this.sketcher.hovering instanceof structures.Atom) {
					as.push(this.sketcher.hovering);
				} else if (this.sketcher.hovering instanceof structures.Bond) {
					as.push(this.sketcher.hovering.a1);
					as.push(this.sketcher.hovering.a2);
				} else if (this.sketcher.hovering instanceof d2._Shape) {
					ss.push(this.sketcher.hovering);
				}
				this.sketcher.lasso.select(as, ss);
			} else if (this.sketcher.lasso.isActive()) {
				this.sketcher.lasso.empty();
			}
		}
		transformType = undefined;
	};
	_.innermousemove = function(e) {
		if (!this.sketcher.lasso.isActive()) {
			var includeMol = this.sketcher.lasso.mode !== tools.Lasso.MODE_LASSO_SHAPES;
			this.findHoveredObject(e, includeMol, includeMol, true);
		} else if (!monitor.SHIFT) {
			var p = false;
			var rotateBuffer = 25 / this.sketcher.specs.scale;
			if (!(math.isBetween(e.p.x, this.sketcher.lasso.bounds.minX, this.sketcher.lasso.bounds.maxX) && math.isBetween(e.p.y, this.sketcher.lasso.bounds.minY, this.sketcher.lasso.bounds.maxY)) && math.isBetween(e.p.x, this.sketcher.lasso.bounds.minX - rotateBuffer, this.sketcher.lasso.bounds.maxX + rotateBuffer) && math.isBetween(e.p.y, this.sketcher.lasso.bounds.minY - rotateBuffer, this.sketcher.lasso.bounds.maxY + rotateBuffer)) {
				p = true;
			}
			if (p != paintRotate) {
				paintRotate = p;
				this.sketcher.repaint();
			}
		}
	};
	_.innerdblclick = function(e) {
		if (this.sketcher.lasso.isActive()) {
			this.sketcher.lasso.empty();
		}
	};
	_.draw = function(ctx) {
		if (paintRotate && this.sketcher.lasso.bounds) {
			ctx.fillStyle = 'rgba(0,0,255,.1)';
			var rotateBuffer = 25 / this.sketcher.specs.scale;
			var b = this.sketcher.lasso.bounds;
			ctx.beginPath();
			ctx.rect(b.minX - rotateBuffer, b.minY - rotateBuffer, b.maxX - b.minX + 2 * rotateBuffer, rotateBuffer);
			ctx.rect(b.minX - rotateBuffer, b.maxY, b.maxX - b.minX + 2 * rotateBuffer, rotateBuffer);
			ctx.rect(b.minX - rotateBuffer, b.minY, rotateBuffer, b.maxY - b.minY);
			ctx.rect(b.maxX, b.minY, rotateBuffer, b.maxY - b.minY);
			ctx.fill();
		}
	};

})(ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.structures, ChemDoodle.structures.d2, ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.uis.tools, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions, states) {
	'use strict';
	states.LonePairState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.LonePairState.prototype = new states._State();
	_.delta = 1;
	_.innermouseup = function(e) {
		if (this.delta < 0 && this.sketcher.hovering.numLonePair < 1) {
			return;
		}
		if (this.sketcher.hovering) {
			this.sketcher.historyManager.pushUndo(new actions.ChangeLonePairAction(this.sketcher.hovering, this.delta));
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, false);
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions, states, structures) {
	'use strict';
	states.MoveState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.MoveState.prototype = new states._State();
	_.action = undefined;
	_.innerdrag = function(e) {
		if (this.sketcher.hovering) {
			if (!this.action) {
				var ps = [];
				var dif = new structures.Point(e.p.x, e.p.y);
				if (this.sketcher.hovering instanceof structures.Atom) {
					dif.sub(this.sketcher.hovering);
					ps[0] = this.sketcher.hovering;
				} else if (this.sketcher.hovering instanceof structures.Bond) {
					dif.sub(this.sketcher.lastPoint);
					ps[0] = this.sketcher.hovering.a1;
					ps[1] = this.sketcher.hovering.a2;
				}
				this.action = new actions.MoveAction(ps, dif);
				this.sketcher.historyManager.pushUndo(this.action);
			} else {
				var dif = new structures.Point(e.p.x, e.p.y);
				dif.sub(this.sketcher.lastPoint);
				this.action.dif.add(dif);
				for ( var i = 0, ii = this.action.ps.length; i < ii; i++) {
					this.action.ps[i].add(dif);
				}
				for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
					this.sketcher.molecules[i].check();
				}
				this.sketcher.repaint();
			}
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, true);
	};
	_.innermouseup = function(e) {
		this.action = undefined;
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(monitor, actions, states, structures, m) {
	'use strict';
	states.NewBondState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.NewBondState.prototype = new states._State();
	_.bondOrder = 1;
	_.stereo = structures.Bond.STEREO_NONE;
	_.incrementBondOrder = function(b) {
		this.newMolAllowed = false;
		if (this.bondOrder === 1 && this.stereo === structures.Bond.STEREO_NONE) {
			this.sketcher.historyManager.pushUndo(new actions.ChangeBondAction(b));
		} else {
			if (b.bondOrder === this.bondOrder && b.stereo === this.stereo) {
				if (b.bondOrder === 1 && b.stereo !== structures.Bond.STEREO_NONE || b.bondOrder === 2 && b.stereo === structures.Bond.STEREO_NONE) {
					this.sketcher.historyManager.pushUndo(new actions.FlipBondAction(b));
				}
			} else {
				this.sketcher.historyManager.pushUndo(new actions.ChangeBondAction(b, this.bondOrder, this.stereo));
			}
		}
	};

	_.innerexit = function() {
		this.removeStartAtom();
	};
	_.innerdrag = function(e) {
		this.newMolAllowed = false;
		this.removeStartAtom();
		if (this.sketcher.hovering instanceof structures.Atom) {
			if (e.p.distance(this.sketcher.hovering) < 15) {
				var angle = this.getOptimumAngle(this.sketcher.hovering, this.bondOrder);
				var x = this.sketcher.hovering.x + this.sketcher.specs.bondLength_2D * m.cos(angle);
				var y = this.sketcher.hovering.y - this.sketcher.specs.bondLength_2D * m.sin(angle);
				this.sketcher.tempAtom = new structures.Atom('C', x, y, 0);
			} else {
				var closest;
				var distMin = 1000;
				for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
					var mol = this.sketcher.molecules[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						var dist = a.distance(e.p);
						if (dist < 5 && (!closest || dist < distMin)) {
							closest = a;
							distMin = dist;
						}
					}
				}
				if (closest) {
					this.sketcher.tempAtom = new structures.Atom('C', closest.x, closest.y, 0);
				} else if (monitor.ALT && monitor.SHIFT) {
					this.sketcher.tempAtom = new structures.Atom('C', e.p.x, e.p.y, 0);
				} else {
					var angle = this.sketcher.hovering.angle(e.p);
					var length = this.sketcher.hovering.distance(e.p);
					if (!monitor.SHIFT) {
						length = this.sketcher.specs.bondLength_2D;
					}
					if (!monitor.ALT) {
						var increments = m.floor((angle + m.PI / 12) / (m.PI / 6));
						angle = increments * m.PI / 6;
					}
					this.sketcher.tempAtom = new structures.Atom('C', this.sketcher.hovering.x + length * m.cos(angle), this.sketcher.hovering.y - length * m.sin(angle), 0);
				}
			}
			for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
				var mol = this.sketcher.molecules[i];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					var a = mol.atoms[j];
					if (a.distance(this.sketcher.tempAtom) < 5) {
						this.sketcher.tempAtom.x = a.x;
						this.sketcher.tempAtom.y = a.y;
						this.sketcher.tempAtom.isOverlap = true;
					}
				}
			}
			this.sketcher.repaint();
		}
	};
	_.innerclick = function(e) {
		if (!this.sketcher.hovering && !this.sketcher.oneMolecule && this.newMolAllowed) {
			this.sketcher.historyManager.pushUndo(new actions.NewMoleculeAction(this.sketcher, [ new structures.Atom('C', e.p.x, e.p.y) ], []));
			if (!this.sketcher.isMobile) {
				this.mousemove(e);
			}
			this.newMolAllowed = false;
		}
	};
	_.innermousedown = function(e) {
		this.newMolAllowed = true;
		if (this.sketcher.hovering instanceof structures.Atom) {
			this.sketcher.hovering.isHover = false;
			this.sketcher.hovering.isSelected = true;
			this.drag(e);
		} else if (this.sketcher.hovering instanceof structures.Bond) {
			this.sketcher.hovering.isHover = false;
			this.incrementBondOrder(this.sketcher.hovering);
			for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
				this.sketcher.molecules[i].check();
			}
			this.sketcher.repaint();
		}
	};
	_.innermouseup = function(e) {
		if (this.sketcher.tempAtom && this.sketcher.hovering) {
			var as = [];
			var bs = [];
			var makeBond = true;
			if (this.sketcher.tempAtom.isOverlap) {
				for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
					var mol = this.sketcher.molecules[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (a.distance(this.sketcher.tempAtom) < 5) {
							this.sketcher.tempAtom = a;
						}
					}
				}
				var bond = this.sketcher.getBond(this.sketcher.hovering, this.sketcher.tempAtom);
				if (bond) {
					this.incrementBondOrder(bond);
					makeBond = false;
				}
			} else {
				as.push(this.sketcher.tempAtom);
			}
			if (makeBond) {
				bs[0] = new structures.Bond(this.sketcher.hovering, this.sketcher.tempAtom, this.bondOrder);
				bs[0].stereo = this.stereo;
				this.sketcher.historyManager.pushUndo(new actions.AddAction(this.sketcher, bs[0].a1, as, bs));
			}
		}
		this.sketcher.tempAtom = undefined;
		if (!this.sketcher.isMobile) {
			this.mousemove(e);
		}
	};
	_.innermousemove = function(e) {
		if (this.sketcher.tempAtom) {
			return;
		}
		this.findHoveredObject(e, true, true);
		if (this.sketcher.startAtom) {
			if (this.sketcher.hovering) {
				this.sketcher.startAtom.x = -10;
				this.sketcher.startAtom.y = -10;
			} else {
				this.sketcher.startAtom.x = e.p.x;
				this.sketcher.startAtom.y = e.p.y;
			}
		}
	};
	_.innermouseout = function(e) {
		this.removeStartAtom();
	};

})(ChemDoodle.monitor, ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(math, monitor, actions, states, structures, m) {
	'use strict';
	states.NewRingState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.NewRingState.prototype = new states._State();
	_.numSides = 6;
	_.unsaturated = false;
	_.getRing = function(a, numSides, bondLength, angle, setOverlaps) {
		var innerAngle = m.PI - 2 * m.PI / numSides;
		angle += innerAngle / 2;
		var ring = [];
		for ( var i = 0; i < numSides - 1; i++) {
			var p = i === 0 ? new structures.Atom('C', a.x, a.y) : new structures.Atom('C', ring[ring.length - 1].x, ring[ring.length - 1].y);
			p.x += bondLength * m.cos(angle);
			p.y -= bondLength * m.sin(angle);
			ring.push(p);
			angle += m.PI + innerAngle;
		}
		for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
			var mol = this.sketcher.molecules[i];
			for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
				mol.atoms[j].isOverlap = false;
			}
		}
		for ( var i = 0, ii = ring.length; i < ii; i++) {
			var minDist = Infinity;
			var closest;
			for ( var k = 0, kk = this.sketcher.molecules.length; k < kk; k++) {
				var mol = this.sketcher.molecules[k];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					var dist = mol.atoms[j].distance(ring[i]);
					if (dist < minDist) {
						minDist = dist;
						closest = mol.atoms[j];
					}
				}
			}
			if (minDist < 5) {
				ring[i] = closest;
				if (setOverlaps) {
					closest.isOverlap = true;
				}
			}
		}
		return ring;
	};
	_.getOptimalRing = function(b, numSides) {
		var innerAngle = m.PI / 2 - m.PI / numSides;
		var bondLength = b.a1.distance(b.a2);
		var ring1 = this.getRing(b.a1, numSides, bondLength, b.a1.angle(b.a2) - innerAngle, false);
		var ring2 = this.getRing(b.a2, numSides, bondLength, b.a2.angle(b.a1) - innerAngle, false);
		var dist1 = 0, dist2 = 0;
		for ( var i = 1, ii = ring1.length; i < ii; i++) {
			for ( var k = 0, kk = this.sketcher.molecules.length; k < kk; k++) {
				var mol = this.sketcher.molecules[k];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					var d1 = mol.atoms[j].distance(ring1[i]);
					var d2 = mol.atoms[j].distance(ring2[i]);
					dist1 += m.min(1E8, 1 / (d1 * d1));
					dist2 += m.min(1E8, 1 / (d2 * d2));
				}
			}
		}
		if (dist1 < dist2) {
			return ring1;
		} else {
			return ring2;
		}
	};

	_.innerexit = function() {
		this.removeStartAtom();
	};
	_.innerdrag = function(e) {
		this.newMolAllowed = false;
		this.removeStartAtom();
		if (this.sketcher.hovering instanceof structures.Atom) {
			var a = 0;
			var l = 0;
			if (e.p.distance(this.sketcher.hovering) < 15) {
				var angles = this.sketcher.getMoleculeByAtom(this.sketcher.hovering).getAngles(this.sketcher.hovering);
				if (angles.length === 0) {
					a = 3 * m.PI / 2;
				} else {
					a = math.angleBetweenLargest(angles).angle;
				}
				l = this.sketcher.specs.bondLength_2D;
			} else {
				a = this.sketcher.hovering.angle(e.p);
				l = this.sketcher.hovering.distance(e.p);
				if (!(monitor.ALT && monitor.SHIFT)) {
					if (!monitor.SHIFT) {
						l = this.sketcher.specs.bondLength_2D;
					}
					if (!monitor.ALT) {
						var increments = m.floor((a + m.PI / 12) / (m.PI / 6));
						a = increments * m.PI / 6;
					}
				}
			}
			this.sketcher.tempRing = this.getRing(this.sketcher.hovering, this.numSides, l, a, true);
			this.sketcher.repaint();
		} else if (this.sketcher.hovering instanceof structures.Bond) {
			var dist = math.distanceFromPointToLineInclusive(e.p, this.sketcher.hovering.a1, this.sketcher.hovering.a2);
			var ringUse;
			if (dist !== -1 && dist <= 7) {
				ringUse = this.getOptimalRing(this.sketcher.hovering, this.numSides);
			} else {
				var innerAngle = m.PI / 2 - m.PI / this.numSides;
				var bondLength = this.sketcher.hovering.a1.distance(this.sketcher.hovering.a2);
				var ring1 = this.getRing(this.sketcher.hovering.a1, this.numSides, bondLength, this.sketcher.hovering.a1.angle(this.sketcher.hovering.a2) - innerAngle, false);
				var ring2 = this.getRing(this.sketcher.hovering.a2, this.numSides, bondLength, this.sketcher.hovering.a2.angle(this.sketcher.hovering.a1) - innerAngle, false);
				var center1 = new structures.Point();
				var center2 = new structures.Point();
				for ( var i = 1, ii = ring1.length; i < ii; i++) {
					center1.add(ring1[i]);
					center2.add(ring2[i]);
				}
				center1.x /= (ring1.length - 1);
				center1.y /= (ring1.length - 1);
				center2.x /= (ring2.length - 1);
				center2.y /= (ring2.length - 1);
				var dist1 = center1.distance(e.p);
				var dist2 = center2.distance(e.p);
				ringUse = ring2;
				if (dist1 < dist2) {
					ringUse = ring1;
				}
			}
			for ( var j = 1, jj = ringUse.length; j < jj; j++) {
				if (this.sketcher.getAllAtoms().indexOf(ringUse[j]) !== -1) {
					ringUse[j].isOverlap = true;
				}
			}
			this.sketcher.tempRing = ringUse;
			this.sketcher.repaint();
		}
	};
	_.innerclick = function(e) {
		if (!this.sketcher.hovering && !this.sketcher.oneMolecule && this.newMolAllowed) {
			this.sketcher.historyManager.pushUndo(new actions.NewMoleculeAction(this.sketcher, [ new structures.Atom('C', e.p.x, e.p.y) ], []));
			if (!this.sketcher.isMobile) {
				this.mousemove(e);
			}
			this.newMolAllowed = false;
		}
	};
	_.innermousedown = function(e) {
		this.newMolAllowed = true;
		if (this.sketcher.hovering) {
			this.sketcher.hovering.isHover = false;
			this.sketcher.hovering.isSelected = true;
			this.drag(e);
		}
	};
	_.innermouseup = function(e) {
		if (this.sketcher.tempRing && this.sketcher.hovering) {
			var as = [];
			var bs = [];
			var allAs = this.sketcher.getAllAtoms();
			if (this.sketcher.hovering instanceof structures.Atom) {
				if (allAs.indexOf(this.sketcher.tempRing[0]) === -1) {
					as.push(this.sketcher.tempRing[0]);
				}
				if (!this.sketcher.bondExists(this.sketcher.hovering, this.sketcher.tempRing[0])) {
					bs.push(new structures.Bond(this.sketcher.hovering, this.sketcher.tempRing[0]));
				}
				for ( var i = 1, ii = this.sketcher.tempRing.length; i < ii; i++) {
					if (allAs.indexOf(this.sketcher.tempRing[i]) === -1) {
						as.push(this.sketcher.tempRing[i]);
					}
					if (!this.sketcher.bondExists(this.sketcher.tempRing[i - 1], this.sketcher.tempRing[i])) {
						bs.push(new structures.Bond(this.sketcher.tempRing[i - 1], this.sketcher.tempRing[i], i % 2 === 1 && this.unsaturated ? 2 : 1));
					}
				}
				if (!this.sketcher.bondExists(this.sketcher.tempRing[this.sketcher.tempRing.length - 1], this.sketcher.hovering)) {
					bs.push(new structures.Bond(this.sketcher.tempRing[this.sketcher.tempRing.length - 1], this.sketcher.hovering, this.unsaturated ? 2 : 1));
				}
			} else if (this.sketcher.hovering instanceof structures.Bond) {
				var start = this.sketcher.hovering.a2;
				var end = this.sketcher.hovering.a1;
				if (this.sketcher.tempRing[0] === this.sketcher.hovering.a1) {
					start = this.sketcher.hovering.a1;
					end = this.sketcher.hovering.a2;
				}
				if (allAs.indexOf(this.sketcher.tempRing[1]) === -1) {
					as.push(this.sketcher.tempRing[1]);
				}
				if (!this.sketcher.bondExists(start, this.sketcher.tempRing[1])) {
					bs.push(new structures.Bond(start, this.sketcher.tempRing[1]));
				}
				for ( var i = 2, ii = this.sketcher.tempRing.length; i < ii; i++) {
					if (allAs.indexOf(this.sketcher.tempRing[i]) === -1) {
						as.push(this.sketcher.tempRing[i]);
					}
					if (!this.sketcher.bondExists(this.sketcher.tempRing[i - 1], this.sketcher.tempRing[i])) {
						bs.push(new structures.Bond(this.sketcher.tempRing[i - 1], this.sketcher.tempRing[i], i % 2 === 0 && this.unsaturated ? 2 : 1));
					}
				}
				if (!this.sketcher.bondExists(this.sketcher.tempRing[this.sketcher.tempRing.length - 1], end)) {
					bs.push(new structures.Bond(this.sketcher.tempRing[this.sketcher.tempRing.length - 1], end));
				}
			}
			if (as.length !== 0 || bs.length !== 0) {
				this.sketcher.historyManager.pushUndo(new actions.AddAction(this.sketcher, bs[0].a1, as, bs));
			}
			for ( var j = 0, jj = allAs.length; j < jj; j++) {
				allAs[j].isOverlap = false;
			}
		}
		this.sketcher.tempRing = undefined;
		if (!this.sketcher.isMobile) {
			this.mousemove(e);
		}
	};
	_.innermousemove = function(e) {
		if (this.sketcher.tempAtom) {
			return;
		}
		this.findHoveredObject(e, true, true);
		if (this.sketcher.startAtom) {
			if (this.sketcher.hovering) {
				this.sketcher.startAtom.x = -10;
				this.sketcher.startAtom.y = -10;
			} else {
				this.sketcher.startAtom.x = e.p.x;
				this.sketcher.startAtom.y = e.p.y;
			}
		}
	};
	_.innermouseout = function(e) {
		this.removeStartAtom();
	};

})(ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(extensions, structures, d2, actions, states) {
	'use strict';
	states.PusherState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.PusherState.prototype = new states._State();
	_.numElectron = 1;
	_.innermousedown = function(e) {
		if (this.sketcher.hovering) {
			this.start = this.sketcher.hovering;
		}
	};
	_.innerdrag = function(e) {
		if (this.start) {
			this.end = new structures.Point(e.p.x, e.p.y);
			this.findHoveredObject(e, true, true);
			this.sketcher.repaint();
		}
	};
	_.innermouseup = function(e) {
		if (this.start && this.sketcher.hovering && this.sketcher.hovering !== this.start) {
			var dup;
			var remove = false;
			for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
				var s = this.sketcher.shapes[i];
				if (s instanceof d2.Pusher) {
					if (s.o1 === this.start && s.o2 === this.sketcher.hovering) {
						dup = s;
					} else if (s.o2 === this.start && s.o1 === this.sketcher.hovering) {
						dup = s;
						remove = true;
					}
				}
			}
			if (dup) {
				if (remove) {
					this.sketcher.historyManager.pushUndo(new actions.DeleteShapeAction(this.sketcher, dup));
				}
				this.start = undefined;
				this.end = undefined;
				this.sketcher.repaint();
			} else {
				var shape = new d2.Pusher(this.start, this.sketcher.hovering, this.numElectron);
				this.start = undefined;
				this.end = undefined;
				this.sketcher.historyManager.pushUndo(new actions.AddShapeAction(this.sketcher, shape));
			}
		} else {
			this.start = undefined;
			this.end = undefined;
			this.sketcher.repaint();
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, true);
		this.sketcher.repaint();
	};
	_.draw = function(ctx) {
		if (this.start && this.end) {
			ctx.strokeStyle = '#00FF00';
			ctx.fillStyle = '#00FF00';
			ctx.lineWidth = 1;
			var p1 = this.start instanceof structures.Atom ? this.start : this.start.getCenter();
			var p2 = this.end;
			if (this.sketcher.hovering && this.sketcher.hovering !== this.start) {
				p2 = this.sketcher.hovering instanceof structures.Atom ? this.sketcher.hovering : this.sketcher.hovering.getCenter();
			}
			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);
			extensions.contextHashTo(ctx, p1.x, p1.y, p2.x, p2.y, 2, 2);
			ctx.stroke();
		}
	};

})(ChemDoodle.extensions, ChemDoodle.structures, ChemDoodle.structures.d2, ChemDoodle.uis.actions, ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions, states, structures, d2) {
	'use strict';
	states.QueryState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.QueryState.prototype = new states._State();
	_.innermouseup = function(e) {
		if (this.sketcher.hovering) {
			if(this.sketcher.hovering instanceof structures.Atom){
				this.sketcher.dialogManager.atomQueryDialog.setAtom(this.sketcher.hovering);
				this.sketcher.dialogManager.atomQueryDialog.getElement().dialog('open');
			}else if(this.sketcher.hovering instanceof structures.Bond){
				this.sketcher.dialogManager.bondQueryDialog.setBond(this.sketcher.hovering);
				this.sketcher.dialogManager.bondQueryDialog.getElement().dialog('open');
			}
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, true, false);
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, ChemDoodle.structures.d2);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(actions, states) {
	'use strict';
	states.RadicalState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.RadicalState.prototype = new states._State();
	_.delta = 1;
	_.innermouseup = function(e) {
		if (this.delta < 0 && this.sketcher.hovering.numRadical < 1) {
			return;
		}
		if (this.sketcher.hovering) {
			this.sketcher.historyManager.pushUndo(new actions.ChangeRadicalAction(this.sketcher.hovering, this.delta));
		}
	};
	_.innermousemove = function(e) {
		this.findHoveredObject(e, true, false);
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(extensions, math, monitor, structures, d2, actions, states, m) {
	'use strict';
	states.ShapeState = function(sketcher) {
		this.setup(sketcher);
	};
	var _ = states.ShapeState.prototype = new states._State();
	_.shapeType = states.ShapeState.LINE;
	_.superDoubleClick = _.dblclick;
	_.dblclick = function(e) {
		// override double click not to center when editing shapes
		if (!this.control) {
			this.superDoubleClick(e);
		}
	};
	_.innerexit = function(e) {
		// set it back to line to remove graphical controls for other shapes
		this.shapeType = states.ShapeState.LINE;
		this.sketcher.repaint();
	};
	_.innermousemove = function(e) {
		this.control = undefined;
		if (this.shapeType === states.ShapeState.BRACKET) {
			var size = 6;
			for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
				var s = this.sketcher.shapes[i];
				if (s instanceof d2.Bracket) {
					var minX = m.min(s.p1.x, s.p2.x);
					var maxX = m.max(s.p1.x, s.p2.x);
					var minY = m.min(s.p1.y, s.p2.y);
					var maxY = m.max(s.p1.y, s.p2.y);
					var hits = [];
					hits.push({
						x : maxX + 5,
						y : minY + 15,
						v : 1
					});
					hits.push({
						x : maxX + 5,
						y : maxY + 15,
						v : 2
					});
					hits.push({
						x : minX - 17,
						y : (minY + maxY) / 2 + 15,
						v : 3
					});
					for ( var j = 0, jj = hits.length; j < jj; j++) {
						var h = hits[j];
						if (math.isBetween(e.p.x, h.x, h.x + size * 2) && math.isBetween(e.p.y, h.y - size, h.y)) {
							this.control = {
								s : s,
								t : h.v
							};
							break;
						} else if (math.isBetween(e.p.x, h.x, h.x + size * 2) && math.isBetween(e.p.y, h.y + size, h.y + size * 2)) {
							this.control = {
								s : s,
								t : -1 * h.v
							};
							break;
						}
					}
					if (this.control) {
						break;
					}
				}
			}
			this.sketcher.repaint();
		}
	};
	_.innermousedown = function(e) {
		if (this.control) {
			this.sketcher.historyManager.pushUndo(new actions.ChangeBracketAttributeAction(this.control.s, this.control.t));
			this.sketcher.repaint();
		} else {
			this.start = new structures.Point(e.p.x, e.p.y);
			this.end = this.start;
		}
	};
	_.innerdrag = function(e) {
		this.end = new structures.Point(e.p.x, e.p.y);
		if (this.shapeType === states.ShapeState.BRACKET) {
			if (monitor.SHIFT) {
				var difx = this.end.x - this.start.x;
				var dify = this.end.y - this.start.y;
				if (difx < 0 && dify > 0) {
					dify *= -1;
				} else if (difx > 0 && dify < 0) {
					difx *= -1;
				}
				var difuse = dify;
				if (m.abs(difx) < m.abs(dify)) {
					difuse = difx;
				}
				this.end.x = this.start.x + difuse;
				this.end.y = this.start.y + difuse;
			}
		} else {
			if (!monitor.ALT) {
				var angle = this.start.angle(this.end);
				var length = this.start.distance(this.end);
				if (!monitor.ALT) {
					var increments = m.floor((angle + m.PI / 12) / (m.PI / 6));
					angle = increments * m.PI / 6;
				}
				this.end.x = this.start.x + length * m.cos(angle);
				this.end.y = this.start.y - length * m.sin(angle);
			}
		}
		this.sketcher.repaint();
	};
	_.innermouseup = function(e) {
		if (this.start && this.end) {
			var shape;
			if (this.start.distance(this.end) > 5) {
				if (this.shapeType >= states.ShapeState.LINE && this.shapeType <= states.ShapeState.ARROW_EQUILIBRIUM) {
					shape = new d2.Line(this.start, this.end);
					if (this.shapeType === states.ShapeState.ARROW_SYNTHETIC) {
						shape.arrowType = d2.Line.ARROW_SYNTHETIC;
					} else if (this.shapeType === states.ShapeState.ARROW_RETROSYNTHETIC) {
						shape.arrowType = d2.Line.ARROW_RETROSYNTHETIC;
					} else if (this.shapeType === states.ShapeState.ARROW_RESONANCE) {
						shape.arrowType = d2.Line.ARROW_RESONANCE;
					} else if (this.shapeType === states.ShapeState.ARROW_EQUILIBRIUM) {
						shape.arrowType = d2.Line.ARROW_EQUILIBRIUM;
					}
				} else if (this.shapeType === states.ShapeState.BRACKET) {
					shape = new d2.Bracket(this.start, this.end);
				}
			}
			this.start = undefined;
			this.end = undefined;
			if (shape) {
				this.sketcher.historyManager.pushUndo(new actions.AddShapeAction(this.sketcher, shape));
			}
		}
	};
	function drawBracketControl(ctx, x, y, control, type) {
		var size = 6;
		if (control && m.abs(control.t) === type) {
			ctx.fillStyle = '#885110';
			ctx.beginPath();
			if (control.t > 0) {
				ctx.moveTo(x, y);
				ctx.lineTo(x + size, y - size);
				ctx.lineTo(x + size * 2, y);
			} else {
				ctx.moveTo(x, y + size);
				ctx.lineTo(x + size, y + size * 2);
				ctx.lineTo(x + size * 2, y + size);
			}
			ctx.closePath();
			ctx.fill();
		}
		ctx.strokeStyle = 'blue';
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + size, y - size);
		ctx.lineTo(x + size * 2, y);
		ctx.moveTo(x, y + size);
		ctx.lineTo(x + size, y + size * 2);
		ctx.lineTo(x + size * 2, y + size);
		ctx.stroke();
	}
	_.draw = function(ctx) {
		if (this.start && this.end) {
			ctx.strokeStyle = '#00FF00';
			ctx.fillStyle = '#00FF00';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this.start.x, this.start.y);
			if (this.shapeType === states.ShapeState.BRACKET) {
				extensions.contextHashTo(ctx, this.start.x, this.start.y, this.end.x, this.start.y, 2, 2);
				extensions.contextHashTo(ctx, this.end.x, this.start.y, this.end.x, this.end.y, 2, 2);
				extensions.contextHashTo(ctx, this.end.x, this.end.y, this.start.x, this.end.y, 2, 2);
				extensions.contextHashTo(ctx, this.start.x, this.end.y, this.start.x, this.start.y, 2, 2);
			} else {
				extensions.contextHashTo(ctx, this.start.x, this.start.y, this.end.x, this.end.y, 2, 2);
			}
			ctx.stroke();
		} else if (this.shapeType === states.ShapeState.BRACKET) {
			ctx.lineWidth = 2;
			ctx.lineJoin = 'miter';
			ctx.lineCap = 'butt';
			for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
				var s = this.sketcher.shapes[i];
				if (s instanceof d2.Bracket) {
					var minX = m.min(s.p1.x, s.p2.x);
					var maxX = m.max(s.p1.x, s.p2.x);
					var minY = m.min(s.p1.y, s.p2.y);
					var maxY = m.max(s.p1.y, s.p2.y);
					var c = this.control && this.control.s === s ? this.control : undefined;
					drawBracketControl(ctx, maxX + 5, minY + 15, c, 1);
					drawBracketControl(ctx, maxX + 5, maxY + 15, c, 2);
					drawBracketControl(ctx, minX - 17, (minY + maxY) / 2 + 15, c, 3);
				}
			}
		}

	};

	states.ShapeState.LINE = 1;
	states.ShapeState.ARROW_SYNTHETIC = 2;
	states.ShapeState.ARROW_RETROSYNTHETIC = 3;
	states.ShapeState.ARROW_RESONANCE = 4;
	states.ShapeState.ARROW_EQUILIBRIUM = 5;
	states.ShapeState.BRACKET = 10;

})(ChemDoodle.extensions, ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.structures, ChemDoodle.structures.d2, ChemDoodle.uis.actions, ChemDoodle.uis.states, Math);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(states) {
	'use strict';
	states.StateManager = function(sketcher) {
		this.STATE_NEW_BOND = new states.NewBondState(sketcher);
		this.STATE_NEW_RING = new states.NewRingState(sketcher);
		this.STATE_CHARGE = new states.ChargeState(sketcher);
		this.STATE_LONE_PAIR = new states.LonePairState(sketcher);
		this.STATE_RADICAL = new states.RadicalState(sketcher);
		this.STATE_MOVE = new states.MoveState(sketcher);
		this.STATE_ERASE = new states.EraseState(sketcher);
		this.STATE_LABEL = new states.LabelState(sketcher);
		this.STATE_LASSO = new states.LassoState(sketcher);
		this.STATE_SHAPE = new states.ShapeState(sketcher);
		this.STATE_PUSHER = new states.PusherState(sketcher);
		this.STATE_QUERY = new states.QueryState(sketcher);
		var currentState = this.STATE_NEW_BOND;
		this.setState = function(nextState) {
			if (nextState !== currentState) {
				currentState.exit();
				currentState = nextState;
				currentState.enter();
			}
		};
		this.getCurrentState = function() {
			return currentState;
		};
	};

})(ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

ChemDoodle.uis.gui.imageDepot = (function() {
	'use strict';
	var d = {};
	d.getURI = function(s) {
		return 'data:image/png;base64,' + s;
	};

	d.ADD_LONE_PAIR = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAANElEQVR42mNgGAWjYHACGyB+DMTPgdiFDHkMAFL8H4qfkyFPewNtoApB2IMM+VEwCgYcAADjvBhZpYZJbQAAAABJRU5ErkJggg==';
	d.ADD_RADICAL = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAL0lEQVR42mNgGAWjYGgAGyB+DMTPgdiFGgaCDPsPxc8HpYE2UINA2GM0BYyCoQAAdQgMLdlWmzIAAAAASUVORK5CYII=';
	d.ANGLE = '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';
	d.ANIMATION = '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';
	d.ARROW_DOWN = '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';
	d.ARROW_EQUILIBRIUM = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAV0lEQVR42mNgGAXDArBQ28AKIL4GxAFAzEMtF/6H4s9AfBKIq4DYBFnRfyrhx0Mj1h5T0ctwYADERUB8FYh/APEvqAKqxCIHEHsA8Xkgbhj0iXgUDAAAAG9tMdQezXJsAAAAAElFTkSuQmCC';
	d.ARROW_RESONANCE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAWUlEQVR42mNgGAWjYPACFiBWwSOvAcQc+AzgAWIXIJ4BxP+h2AOPehMkdduAuAiIbaDmMNQgSVIDo7hwERkuPADEFUDsAHMhriBwgIYlNgDynshoUhsFVAIA/dMiIBsQRGUAAAAASUVORK5CYII=';
	d.ARROW_RETROSYNTHETIC = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAYElEQVR42mNgGI5AhZqGKQDxbSA2oaahBrQ01ILahr4HYhtskv8pwF9xGUouAHn7MRA7UNNQG6hrPahtoA+1vPwc3XWURooPtZLNc2qFG8iw+9Q2zIFahQPV05zG0C59AY3IMME0CTYYAAAAAElFTkSuQmCC';
	d.ARROW_SYNTHETIC = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR42mNgGAWjgC5ABoh5qGmgAhD/B+I7QJwAxALUMPQg1NAHQPwdiPegG/6fipgssA+q+REQ/wDivUCcAsQi5EYKLAzJNgQ9UmRGE/tIBgDIaCG7b3KulAAAAABJRU5ErkJggg==';
	d.BENZENE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA5klEQVR42s2VPwrCMBSH06k0o1MX6R2c7A08hDfRRdDVgp5BR71GvUKdtHNvIMRf4FcoIdgkzeCDD0r+fLyQl1ch3GMmIkUOzuADDkBOEVWgA0ewABfQgjVIQkU5x/vMlqAGD1CGiFKwBS+QcSxhli2znpsyvVAZIh0r8AQ3UFiS0FnvuDczJ9XgW2++g4bSsVC/BiWPt+FxXSRqbEHmmZVyTvtvhTKmUMvesS+lYO0Fl01f2JWlsJvQws75UjpDnPL4Xk/PRdzLSjaGmo3Cq30Nxbp9XXlhXu3LJj6xwe6nNNigX8AXVupH9hGtsNcAAAAASUVORK5CYII=';
	d.BOND_ANY = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA3UlEQVR42mNgGMRAgJqGeQDxc2oZ6gLE76GGUs0wH2oYZkNNw0Auew3EEQMS/fOB2AGJbwQVg4FsIFYA4glArAkVEwfiemyGqUOjfw2SGMjwv0AcB+V3Qg0CheFaqNhUqF4M0A3E/kB8H4hFkQyciiTWieSyDUCcAhXDAGxAfB6I+YG4C4hLkAwsAuIkIF6GZiCIfgPEfNgMDAPi9UDcCMTNQHwJzUAGqPx5JANB4AKuyNgMxMJI/FVAbI1moAg0jLWIMZCmifY9tRItVfOmBzUNE4AGtgc1sxxVCkcAqLktfrI9I0gAAAAASUVORK5CYII=';
	d.BOND_DOUBLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAQUlEQVR42mNgoA7gZqAicADi+0DMRS3DXgGxPTVcim4YzKVUMwyZP2rYqGGjhg0Dw7ihpQRVDIMBLmoahsulZAEA2GgvCVlTJIIAAAAASUVORK5CYII=';
	d.BOND_DOUBLE_AMBIGUOUS = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAwElEQVR42q2UsQ2DQBAE38EnBDQAJUBGA6YM04UD3n1AYhdhMkqAHpw4owgkJNbSfuLw904aIZLV3t/tOWdTmTOsGnytRHPwATcLpxcwgYH/HZ0mVwALXY10WqWKtWADDVjBm+0nVUmxO79BadPT0UyxqzrVF4V+b1eoYg+wgyedymIH6FUhzzZ3C7GSA9jYplRxz2YOwCtxCn97VihBn+ioUfesZhYHZnNVEpDxSsQTNDKbJhe3o9PcGVR0WikiJ/j5KxJqecPNAAAAAElFTkSuQmCC';
	d.BOND_HALF = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAYklEQVR42mNgGAVkAA8g3k4tw0yA+DXUUIqBC9SwGGq57jYQ+1Az7FioYYgCtQwCAQMgvg/EKtQy7DG1YtMB6jKqRUAFtVxGVeBATVeBIuA5tcIMFptUMUyH2rHJAXXh4AIAvQ0O0wCO68MAAAAASUVORK5CYII=';
	d.BOND_PROTRUDING = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAl0lEQVR42mNgoAwEAHEDA5WAChC/B+L/1DCUBYivQw37Tw1Dl6MZRpGhBTgM+w3EFaQaZgPEn7EY9hiIPUg1TAaI72Mx7DAQK5ATCbuxGNYPxDzkhFs3lvCKoCTxIht2G4g1qJF4QXg9uV5ET7xkJQlciZesJIEr8ZKVJHAl3n5Kwgs58d6mJEmgR8J0SpIENq/yMAx7AADDzz/MOB6JagAAAABJRU5ErkJggg==';
	d.BOND_QUADRUPLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAYElEQVR42mNgIA9wM1AROADxfSDmopZhr4DYnhouRTeMIpdiM4xslxIyjCSXEmMY0S4l1TCYS6lmGDJ/1DAKDeOGxg5VDIMBLmoaRq5LiQJc1DSMWJeSBbioaRgulxIFAGBAR5Vp19YFAAAAAElFTkSuQmCC';
	d.BOND_QUINTUPLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAcElEQVR42q3UsQ2AMAxEUdfJUGb/JdwzBRYChKIkzsV3kguap98QEWxViDv8zK+wsNNPGaUtlirtYdulEQaVrmDLpSg2Ld3BhqVZ7C2lYd93fWQl4fcKE/v/+MbCsqXhE2UsDC2FH1NjYVFpam3pdBfQk0tlqZTZlgAAAABJRU5ErkJggg==';
	d.BOND_RECESSED = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAQUlEQVR42mNgGGQghJqGBQDxbyBOoaahCYPSUGyaYYYOI28y4PDm4IxNBmp6k2JAE28OPvAdiBuoaaALwyggBQAA+tATdpIiCMcAAAAASUVORK5CYII=';
	d.BOND_RESONANCE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAfUlEQVR42mNgoA7gZqAicADi+0DMRS3DXgGx/aA3zAOIt1PLMBMgfg01lGLDXKCGxVArzG4DsQ81I4CFGoYpkGsQNsMMoIlYhVqGPaZWbMKyF9UioIJaLqNqdnIg11W4IuA5uWHGDQ1w9Nj0ocS7sMJRh5LYxAY4oC4kGwAAJbAmYdoaIPoAAAAASUVORK5CYII=';
	d.BOND_SEXTUPLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAZElEQVR42s3OMQ6AMAxDUc/uocr9L8HOKZqBCaXgBiNhKevPA7Q1GLfF7XF0xY647pBeY6+kWawsfYotSZWYLF2N3Uorsam0nZ+6U8o/S/GFFE5pOjpjVak0OmOqtDQ6YzNpugFelEmRwpAbowAAAABJRU5ErkJggg==';
	d.BOND_SINGLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAMklEQVR42mNgGMSAm5qGOQDxfSDmopZhr4DYftSwUcNGDRs1jP6GcUPLM6oYBgNUKRwBiE8XjxDJvZUAAAAASUVORK5CYII=';
	d.BOND_TRIPLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUUlEQVR42mNgoAxwM1AROADxfSDmopZhr4DYnhouRTeMIpdiM4xslxIyDOZSqhmGzB81bNSwATeMG5rCqWIYDHBR0zBiXUoW4KKmYbhcShIAAA2MPiFy45L3AAAAAElFTkSuQmCC';
	d.BOND_ZERO = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAH0lEQVR42mNgGAVkgPtQPHgNHA2z0TAbDbPRMBsAAADVkQ3x7nq43wAAAABJRU5ErkJggg==';
	d.BROMINE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA3UlEQVR42mNgGAVUB8s0NDYu09T8D8LLNTVvA+lZKzQ1dSg18MRSTU2X5RoarUD2dyC+SKmBu+B8Tc0FQPx3prExK1UMXK6lNRPo2rNIFnQB1UwCikUs09K6DuQXEGXgQg0NYaCGGCD7xVItLX8kA5cD8R1QsADDOBZosCoxBv6F4v9AQxNR5CEGPl2kpydGkpdXqalJA+ksIH4AxLNRDASqITsMgV6yA7kUlnQoNhCYdBRABgINzqTEwINAA+SXq6ubANnrgfgfiE2Jgf+h+C0QrwSKBZMdhqNg4AEAUSSF6Clvq/4AAAAASUVORK5CYII=';
	d.CALCULATE = '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';
	d.CARBON = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA2klEQVR42mNgGAXYwMyZM1knTZqk1dvbK9vQ0MBEtkETJ06UmzBhwi4g/gXEn4D4L5R9jGTDQK4BanwPxNeArtP///8/4/z58zmAfFcg7iHZQKCmaUD8derUqRIUh9mqVauYgYb9ABlKlUiYPHmyItCw//39/QlUMRBokAPIQFB4UcXAvr4+XaiB4VQxsLu7mxtqYDPVEjM0/b0BJhk+qhgINMgQaOBvID4LS4fAXMIC5JsDw3gCuZFjBDTgPNT7n4H4O1DsApDuoMi1HR0d/MBsaAyiR0s22gMANJ6AxDvp00kAAAAASUVORK5CYII=';
	d.CHARGE_BRACKET = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAYUlEQVR42mNgGAnACYhF0AX/Q3EDDk0NSGrQwUogNsZmIDEApk4MiOWheAsQ+yLxyTJwIhBfgOIPQHwLiU+WgVT3Mk0NlAZiDkoNXAjEz3Bgil1IkcJRA4e6geSWNkMMAAAxJTQf078zGQAAAABJRU5ErkJggg==';
	d.CHLORINE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA9klEQVR42mNgGAXIwPi/MavcZzkt5bfKsgz/GZiQ5RTeKyTIfZBLI8ogpXdKcgofFHbJf5D/BcSfgPgvlH0MpgbIXq7wUWEjQcNArgEqfg/E1xTfK+oDXcao8F+BA+gaV6BYD8kGAhVOA+KvCl8UJAioI8LA/wzMQIU/QIYSYTFhA4GKFIH4PyjAqWIg0CAHkIGg8KKKgTLvZHTBLvygEE4VA8VfiHODDATGcTNVDAR7G5L+3qi8VeGjioFA1xkCFf8G4rOwdAjELEDN5kA8gWQDoYqNgPg82Psf5D8D8XcgvgB0fQdZBiJlQX5gjBuD6NGSjX4AAER4jBfAQ3QdAAAAAElFTkSuQmCC';
	d.CLEAR = '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';
	d.CYCLOBUTANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAiklEQVR42q3UwQ2AIAwF0E7hOv4bTCN7uwIXG0MTYgRa2iYNF3lB+ECkr4MCK3NX7hSBgfvmvtp4RmCCnB4Ug8lbKBaTTCiUH6tQGH9nimJzw3/R7IyEoEluQG0581RpzlvJuUL0KyRnaKd7b0VVB6lFTalYoVsRG6HwHOAXRcQTJmiJwPqcql7sB1sQMyMuYZLDAAAAAElFTkSuQmCC';
	d.CYCLOHEPTANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA+UlEQVR42mNgIB4IMFABMAOxJxCvAeK/QLwAiA3IMUgTiDuB+CkQnwDiDCBWAuIKIH4ExIeAOASIWfAZIgzEmUB8EmpQBxBr4HA1yLCDUMMrgVgcXREPEP8D4pVA7AHVRAzQB+J5UL08yBKKQPyQgrAGuVQBWcARiA9QYCDI+w7IAonQGCQXLATiBGSBRiBuoMBADP0YNpAIMHyIEQYkAow4wIglEgFKKuGFpiMTCgw0gZrBCxMIgdogQYZhElC9IegS1dB8y0GCYRzQrFqNS8FSKCYWLCOkngPqymoiDKsh1kewMAnCoyaY1DA3BOL/BLAhqbHHRY4cAH9nN15emqC1AAAAAElFTkSuQmCC';
	d.CYCLOHEXANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAoElEQVR42mNgIB4IMVAJSADxZCD+A8StQMxFiUH9QPwWiPuA2AiIlwLxYyCOAWJGcg2SQJO3AOITQHwSiC0pMQgZMEJd+Rjqall0BZxA/J8Ig9ABKDwboXo50SX/UxBx/4kWHDVw1EDcemEJu5+aCVsCmlPeEmEwwaxHisGW0ILhBLSgIKn4QjYYVHwtA+JHpBZf2AyeBC1gWygpYMmqAgB+TzRkG9cEtwAAAABJRU5ErkJggg==';
	d.CYCLOOCTANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABBElEQVR42q2UvQ6CMBSFSXS1g4PRzVUXeRGdHH0KWfQlINGB1VcgzJLokxB2B3dIPDWnSYO1QutJvkB/ONxL7yUIumsU/EFLEIECNCAHOyC6GozBBqSgJPJ+DaY0y8CTVzme2MxkFFewBwvLiwXNcj4zM23a0KyvLuBgWkgZWV+FoAKD9kL5I02b7mDbPs3Soxqk2U2fiJiyq4ZMe6UmCpaGj448oHcHNKwz3yao1UB1gI8ScFID1QGuktk99CwF20l4RBe3JzPHtD+i09POHQzPpugC/jUaHn3YMbIzT3b+bdOMjV5p7TQ0GCVMM7aZ6Rpo7VSxaJctI+e6XfEz1Kwzq9ELFZA4hr9lYwQAAAAASUVORK5CYII=';
	d.CYCLOPENTANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA0klEQVR42mNgIB6IMFAJMAFxKRD/BuI0Sg1TAeJDUOwOxFeBeAEQc5Hjqnwgfg3EeUDMCBUHGTQfarAWOa5SxqEmHohfAXECOa7CBbTwBYEWEa7CBpCDwAAmKAjEf6ExyUhm5KUD8R8gFoAJ7AHiIApSA0jvbmSBHKjTyQUgvdnIAvJA/BIaMeQksZdQM1DAJSC2IMNAS6heDNAKxaQCnPpw2kQA4PQZzrDAAwiGPUZsEQCg1DGPUHraQYKBOwmlXx4g/k8i5iFkKxsJLmRjoDUAAID6NQMa+if+AAAAAElFTkSuQmCC';
	d.CYCLOPROPANE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAjElEQVR42mNgGE5AgZqGiQDxfyCWoJaBk4H4ORBPp4ZhGkB8G4h5gPg6EBtQauB2IA6Asj2AeD8Qs5BrGDYDkC0gCbDg8CIsCDhINbAATySAIqmC1GRyH08yISRPlgsKiE1GxIYRC7HJiJRYJJiMyElnOB3AQmZOwBlEBRTkVYxIlICWJpRimcFfCgMA4CwtbAP2SjIAAAAASUVORK5CYII=';
	d.DECREASE_CHARGE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAs0lEQVR42mNgGAU4gAAQK0BpsgELEGcA8WUg/g3E/6H4NhCXQOVJMmw/EL8G4gYgdoC60AKIK4D4ORAfB2IeYg07DMT3gVgFhxoZID4PNZSDkIE5UJepEFAnA3VpCSEDL0O9SQyogIYp3tj8DQ0zUPhI4sE80DD9jy/2FaAKFKCu/I8H16Opp48LqR6GNIllWDq8jidsZKBqiEqHyIZSJacgG5oDdSly7N6HepNjwEubwQEAQdI454gPA8EAAAAASUVORK5CYII=';
	d.DISTANCE = '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';
	d.ERASE = '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';
	d.FLUORINE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUElEQVR42mNgGAU0AxPuB26c8CDgPxr+SqmBpyc+DDCG4UkP/AwpNXAvtb08+A38A8SfYbj/ob8LpQae6Hvoqw3DU1+F8oxGygAaOAoGDgAAN7dbSHln+I0AAAAASUVORK5CYII=';
	d.HYDROGEN = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAANElEQVR42mNgGAW0BBuBeC8W8SIg/jtqINEGngBiTTTcSYmB/4D4Jxr+Mxopw8jAUTBAAADIhCT11Q14ZwAAAABJRU5ErkJggg==';
	d.INCREASE_CHARGE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAyklEQVR42mNgGAU4gAAQK0BpsgELEGcA8WUg/g3E/6H4NhCXQOVJMmw/EL8G4gYgdoC60AKIK4D4ORAfB2IeYg07DMT3gVgFKsYDNRhmgAwQn4caykHIwByoy1SQxCSh3pVEEpOBurSEkIGXoa5hIGAgA9T7twnF5m9omPFADQBhA6iBBkhiPNAw/Y8v9hWgChSgrvyPB9ejqaePC6kehjSJZVg6vI4UNjzQMENOh4eJTYfIhlIlpyAbmgN1KXLs3od6k2PAS5vBAQCFSEECjKrjagAAAABJRU5ErkJggg==';
	d.IODINE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAI0lEQVR42mNgGAV0AVMYpmyeyjB196iBowaOGkhXA0cBfQEADcspQU08dAAAAAAASUVORK5CYII=';
	d.LASSO = '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';
	d.LASSO_SHAPES = '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';
	d.MARQUEE = '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';
	d.MOVE = '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';
	d.NITROGEN = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAoElEQVR42mNgGAU0AwaBPzYaBPx4Z+z7SQRZXN/vlyFQ/L9l6H9Ocgz8b+D/YxY1DfwJxH8N/X6ZUMdAoOuAml8ZBPw8wcDwn5EaLuw09P8eBzJA3/97IlUMBLMDfuwH4pfGof/5qWKgUeBPTWh4TqCKgRD+91Yg/zcsCCg2EGQAkH8PiJ9SxUAQMAz44QlOm9QyEBzLAT/WkGXgKBg4AABF1poQYk+4pAAAAABJRU5ErkJggg==';
	d.OPEN = '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';
	d.OPTIMIZE = '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';
	d.OXYGEN = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABCklEQVR42mNgGAXYwH8pKa7/PDxa/xkY2CgzSFBQ7j8v7wEg/gPEn4H4JxBvAGJh0g3j4pICanwDxCf+8/MrgcW4uXWB/FtAfA/katIM5OGZCNT44b+AgACKOD+/MtTFxcQbxsDADNTwDWQoVnle3nVAfJt4A/n5FYEa/v/n44vF4fpqoPxfoiMJqMEBbCA3twsOFyaC5aFhS4yBOmANPDwhOAwsAssLCfERG4acQA3/gLgKqzwf33Sg3CvSYpmXdy0Q3wEazoQiLirKAxR/jyvC8BmoAY3pZTCvAcNUHCi2F5w+eXhESU/ckLC8CE13T8Axy8u7D5SDKMuCvLwiwBg1Bnl3tGSjPQAAoX15+BfxFYQAAAAASUVORK5CYII=';
	d.PERIODIC_TABLE = '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';
	d.PERSPECTIVE = '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';
	d.PHOSPHORUS = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeElEQVR42mNgGAU0A/8bGDYC8X8o/gLEV/43MqRSZmA9wwkgtgAalA/kXwSy//1vYtCnxIW74PxGBnewa+sZMqhjYD2DCtTAHOoY2MDQAjXQjBIDrwANKALS+4H4D5A9g9JY/gA1bC4Q+1Ej2eyidjocSQaOgoEDAIsaZcCSspZYAAAAAElFTkSuQmCC';
	d.PUSHER_BOND_FORMING = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABAUlEQVR42mNgQAAdIH4PxJeBOIaBOBABxNeB+DkQm6BLdgNxPxBbAPFjIGYhwsD7QOwAxM1APBld8jRUkgHqSg0ChilAXccA1XceXQHI2TJQ9mwgziFgYAoQL4ayJYD4NbqC/0jeLADi6QQMBHmxBE0/hoHIgb2agIGr0SLvPz7FFtAwxQdOQ9XhjK37aAF+n4gYVsBlBrqBEtBIwgeeQ9XhMoMBW5iCwugaUviA6IdAnEAozHAZ+ARKb4aKrUcylCwDvwLxDyBWgYqB6F9QObIMPAnE89HElwDxH3IN/I7kOgYkV5Jt4HwcchvJNVAFh5wKOQYOLtCAlBQowfVUNxAAeY1sopoKHG8AAAAASUVORK5CYII=';
	d.PUSHER_DOUBLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA8klEQVR42mNgGACgA8QxQBwAxCKUGOQAxKeB+DwQzwfiw0D8HohzyDEM5JrXQBwBxCxI4hpQC7pJ9eJjIDbBIS8BxLeBOIFYA/cDcQUBNSZQS3mICbfbaN7EBZYDcQEhRYuJcB0MeEDDE6flPNBYVCDSQBYCYQ327mUSUwPI2ym4JEuAeDaRBskAsQpUz3SoK1WwhV8JkQaCguc/NOHfg7IxYhyUE1xI8O5zqEEwjAFuY3M2HpAJxP+ghu3FpgAUwwIkGAhS+xdqYC82Bf/JyPM3ofpiqGVgGVSfCbXKSgFsMXwfinHxCYF+dAFKDZRB5gAAj/I5E2fZy9MAAAAASUVORK5CYII=';
	d.PUSHER_SINGLE = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAA6ElEQVR42mNgGACgA8QxQBwAxCKUGOQAxKeB+DwQzwfiw0D8HohzyDEM5JrXQBwBxCxI4hpQC7pJ9eJjIDbBIS8BxLeBOIFYA/cDcQUBNSZQS3mICbfbaN7EBZYDcQEhRYuJcB0MeEDDE6flPNBYVCDSQBYCYQ327mUSUwPI2ym4JEuAeDaJBoL0TIeyZdB9txiqgBTgAU38O4H4P9RQOADlBBcSDVSAGvQPiO+gS4KSiwqJBgpADbyKLSzfQxWQCkAGfsFWcPwnsxAB6duOS4JcA1OoWV7+x1VO3odiUsFxXBLkGoiSdgEanzHP7ILArQAAAABJRU5ErkJggg==';
	d.QUERY = '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';
	d.REDO = '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';
	d.REMOVE_LONE_PAIR = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAN0lEQVR42mNgGAWjYHACBSDeD8T/gfg4lE+KPAYAKTaBsg2gmkiRxwD/KeTT3oVUD8NRMAoIAAADoBa5tWLP/wAAAABJRU5ErkJggg==';
	d.REMOVE_RADICAL = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAM0lEQVR42mNgGAWjYGgABSDeD8T/gfg4lE8RABlmAmUbQA2lCPwnwB94F1I9DEfBKEADAAT6C11yCuPwAAAAAElFTkSuQmCC';
	d.SAVE = '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';
	d.SEARCH = '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';
	d.SETTINGS = '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';
	d.SULFUR = 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAwUlEQVR42mNgGAXo4P9/Y7n///Wl//9nYKTQIAP///8NzwIN+w5k/wHir0BsQK6ruICa3wHxEiCbH8I3jPv/X1eJTAP1jICG/Qe6zoxK4WYmDDTwNxDXUzEyDOZBXGkw+/9/cz4qGMjACHIhEP8D4gdkRwgWl1oD8UNoLFtTKy2KAA17DcTzqRimhjuABh4jU7O+IdCAiP//VdihhpkADfsJpJvJdY0z0ICP0KTzDBoxi2EWUJiPDUxBYThaqtEPAAAQY5TwZ4cDHAAAAABJRU5ErkJggg==';
	d.TORSION = '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';
	d.UNDO = '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';
	d.ZOOM_IN = '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';
	d.ZOOM_OUT = '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';

	return d;

})();
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(desktop, imageDepot, q) {
	'use strict';
	desktop.Button = function(id, icon, tooltip, func) {
		this.id = id;
		this.icon = icon;
		this.toggle = false;
		this.tooltip = tooltip ? tooltip : '';
		this.func = func ? func : undefined;
	};
	var _ = desktop.Button.prototype;
	_.getElement = function() {
		return q('#' + this.id);
	};
	_.getSource = function(buttonGroup) {
		var sb = [];
		if (this.toggle) {
			sb.push('<input type="radio" name="');
			sb.push(buttonGroup);
			sb.push('" id="');
			sb.push(this.id);
			sb.push('" title="');
			sb.push(this.tooltip);
			sb.push('" /><label for="');
			sb.push(this.id);
			sb.push('"><img id="');
			sb.push(this.id);
			sb.push('_icon" title="');
			sb.push(this.tooltip);
			sb.push('" width="20" height="20" src="');
			sb.push(imageDepot.getURI(this.icon));
			sb.push('"></label>');
		} else {
			sb.push('<button id="');
			sb.push(this.id);
			sb.push('" onclick="return false;" title="');
			sb.push(this.tooltip);
			sb.push('"><img title="');
			sb.push(this.tooltip);
			sb.push('" width="20" height="20" src="');
			sb.push(imageDepot.getURI(this.icon));
			sb.push('"></button>');
		}
		return sb.join('');
	};
	_.setup = function(lone) {
		var element = this.getElement();
		if (!this.toggle || lone) {
			element.button();
		}
		element.click(this.func);
	};
	_.disable = function() {
		var element = this.getElement();
		element.mouseout();
		element.button('disable');
	};
	_.enable = function() {
		this.getElement().button('enable');
	};
	_.select = function() {
		var element = this.getElement();
		element.attr('checked', true);
		element.button('refresh');
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.uis.gui.imageDepot, ChemDoodle.lib.jQuery);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(desktop, q) {
	'use strict';
	desktop.ButtonSet = function(id) {
		this.id = id;
		this.buttons = [];
		this.toggle = true;
	};
	var _ = desktop.ButtonSet.prototype;
	_.getElement = function() {
		return q('#' + this.id);
	};
	_.getSource = function(buttonGroup) {
		var sb = [];
		sb.push('<span id="');
		sb.push(this.id);
		sb.push('">');
		for ( var i = 0, ii = this.buttons.length; i < ii; i++) {
			if (this.toggle) {
				this.buttons[i].toggle = true;
			}
			sb.push(this.buttons[i].getSource(buttonGroup));
		}
		if (this.dropDown) {
			sb.push(this.dropDown.getButtonSource());
		}
		sb.push('</span>');
		if (this.dropDown) {
			sb.push(this.dropDown.getHiddenSource());
		}
		return sb.join('');
	};
	_.setup = function() {
		this.getElement().buttonset();
		for ( var i = 0, ii = this.buttons.length; i < ii; i++) {
			this.buttons[i].setup(false);
		}
		if (this.dropDown) {
			this.dropDown.setup();
		}
	};
	_.addDropDown = function(tooltip) {
		this.dropDown = new desktop.DropDown(this.id + '_dd', tooltip, this.buttons[this.buttons.length - 1]);
	};
	
	_.disable = function() {
		for (var i = 0, ii = this.buttons.length; i < ii; i++) {
			this.buttons[i].disable();
		}
	};
	
	_.enable = function() {
		for (var i = 0, ii = this.buttons.length; i < ii; i++) {
			this.buttons[i].enable();
		}
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery);
//
// Copyright 2009-2015 iChemLabs, LLC. All rights reserved.
//
(function(desktop, q) {
	'use strict';
	desktop.CheckBox = function(id, tooltip, func, checked) {
		this.id = id;
		this.checked = checked ? checked : false;
		this.tooltip = tooltip ? tooltip : '';
		this.func = func ? func : undefined;
	};
	var _ = desktop.CheckBox.prototype = new desktop.Button();
	_.getSource = function() {
		var sb = [];
		sb.push('<input type="checkbox" id="');
		sb.push(this.id);
		sb.push('" ');
		if (this.checked) {
			sb.push('checked="" ');
		}
		sb.push('><label for="');
		sb.push(this.id);
		sb.push('">');
		sb.push(this.tooltip);
		sb.push('</label>');
		return sb.join('');
	};
	_.setup = function() {
		this.getElement().click(this.func);
	};
	
	_.check = function() {
		this.checked = true;
		this.getElement().prop('checked', true);
	};
	
	_.uncheck = function() {
		this.checked = false;
		this.getElement().removeAttr('checked');
	};
})(ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery);
//
// Copyright 2009-2015 iChemLabs, LLC. All rights reserved.
//
(function(desktop, q) {
	'use strict';
	desktop.ColorPicker = function (id, tooltip, func) {
		this.id = id;
		this.tooltip = tooltip ? tooltip : '';
		this.func = func ? func : undefined;
	};
	var _ = desktop.ColorPicker.prototype;
	_.getElement = function() {
		return q('#' + this.id);
	};
	_.getSource = function() {
		var sb = [];
		sb.push('<table style="font-size:12px;text-align:left;border-spacing:0px"><tr><td><p>');
		sb.push(this.tooltip);
		sb.push('</p></td><td><input id="');
		sb.push(this.id);
		sb.push('" class="simple_color" value="#000000" /></td></tr></table>');
		return sb.join('');
	};
	_.setup = function() {
		this.getElement().simpleColor({
			boxWidth : 20,
			livePreview : true,
			chooserCSS: { 'z-index' : '900'},
			onSelect : this.func });
	};
	_.setColor = function(color) {
		this.getElement().setColor(color);
	};
})(ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(desktop, q, document) {
	'use strict';
	desktop.Dialog = function(sketcherid, subid, title) {
		// sketcherid is the DOM element id everything will be anchored around
		// when adding dynamically.
		this.sketcherid = sketcherid;
		this.id = sketcherid + subid;
		this.title = title ? title : 'Information';
	};
	var _ = desktop.Dialog.prototype;
	_.buttons = undefined;
	_.message = undefined;
	_.afterMessage = undefined;
	_.includeTextArea = false;
	_.includeTextField = false;
	_.getElement = function() {
		return q('#' + this.id);
	};
	_.getTextArea = function() {
		return q('#' + this.id + '_ta');
	};
	_.getTextField = function() {
		return q('#' + this.id + '_tf');
	};
	_.setup = function() {
		var sb = [];
		sb.push('<div style="font-size:12px;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		if (this.message) {
			sb.push('<p>');
			sb.push(this.message);
			sb.push('</p>');
		}
		if (this.includeTextField) {
			sb.push('<input type="text" style="font-family:\'Courier New\';" id="');
			sb.push(this.id);
			sb.push('_tf" autofocus></input>');
		}
		if (this.includeTextArea) {
			sb.push('<textarea style="font-family:\'Courier New\';" id="');
			sb.push(this.id);
			sb.push('_ta" cols="55" rows="10"></textarea>');
		}
		if (this.afterMessage) {
			sb.push('<p>');
			sb.push(this.afterMessage);
			sb.push('</p>');
		}
		sb.push('</div>');
		if (document.getElementById(this.sketcherid)) {
			var canvas = q('#' + this.sketcherid);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		var self = this;
		this.getElement().dialog({
			autoOpen : false,
			width : 435,
			buttons : self.buttons
		});
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, structures, actions, desktop, q, document) {
	'use strict';

	var makeRow = function(id, name, tag, description, component) {
		var sb = ['<tr>'];
		// checkbox for include
		sb.push('<td>');
		if(id.indexOf('_elements')===-1){
			sb.push('<input type="checkbox" id="');
			sb.push(id);
			sb.push('_include">');
		}
		sb.push('</td>');
		// name and tag
		sb.push('<td>');
		sb.push(name);
		if(tag){
			sb.push('<br>(<strong>');
			sb.push(tag);
			sb.push('</strong>)');
		}
		sb.push('</td>');
		// component
		sb.push('<td style="padding-left:20px;padding-right:20px;">');
		sb.push(description);
		if(component){
			if(component===1){
				sb.push('<br>');
				sb.push('<input type="text" id="');
				sb.push(id);
				sb.push('_value">');
			}else{
				sb.push(component);
			}
		}
		sb.push('</td>');
		// checkbox for not
		sb.push('<td><input type="checkbox" id="');
		sb.push(id);
		sb.push('_not"><br><strong>NOT</strong>');
		sb.push('</td>');
		// close
		sb.push('</tr>');
		return sb.join('');
	};
	
	desktop.AtomQueryDialog = function(sketcher, subid) {
		this.sketcher = sketcher;
		this.id = sketcher.id + subid;
	};
	var _ = desktop.AtomQueryDialog.prototype = new desktop.Dialog();
	_.title = 'Atom Query';
	_.setAtom = function(a) {
		this.a = a;
		var use = a.query;
		if(!use){
			use = new structures.Query(structures.Query.TYPE_ATOM);
			use.elements.v.push(a.label);
		}
		for(var i = 0, ii = this.periodicTable.cells.length; i<ii; i++){
			this.periodicTable.cells[i].selected = use.elements.v.indexOf(this.periodicTable.cells[i].element.symbol)!==-1;
		}
		this.periodicTable.repaint();
		q('#'+this.id+'_el_any').prop("checked", use.elements.v.indexOf('a')!==-1);
		q('#'+this.id+'_el_noth').prop("checked", use.elements.v.indexOf('r')!==-1);
		q('#'+this.id+'_el_het').prop("checked", use.elements.v.indexOf('q')!==-1);
		q('#'+this.id+'_el_hal').prop("checked", use.elements.v.indexOf('x')!==-1);
		q('#'+this.id+'_el_met').prop("checked", use.elements.v.indexOf('m')!==-1);
		q('#'+this.id+'_elements_not').prop("checked", use.elements.not);
		
		q('#'+this.id+'_aromatic_include').prop("checked", use.aromatic!==undefined);
		q('#'+this.id+'_aromatic_not').prop("checked", use.aromatic!==undefined&&use.aromatic.not);
		q('#'+this.id+'_charge_include').prop("checked", use.charge!==undefined);
		q('#'+this.id+'_charge_value').val(use.charge?use.outputRange(use.charge.v):'');
		q('#'+this.id+'_charge_not').prop("checked", use.charge!==undefined&&use.charge.not);
		q('#'+this.id+'_hydrogens_include').prop("checked", use.hydrogens!==undefined);
		q('#'+this.id+'_hydrogens_value').val(use.hydrogens?use.outputRange(use.hydrogens.v):'');
		q('#'+this.id+'_hydrogens_not').prop("checked", use.charge!==undefined&&use.charge.not);
		q('#'+this.id+'_ringCount_include').prop("checked", use.ringCount!==undefined);
		q('#'+this.id+'_ringCount_value').val(use.ringCount?use.outputRange(use.ringCount.v):'');
		q('#'+this.id+'_ringCount_not').prop("checked", use.ringCount!==undefined&&use.ringCount.not);
		q('#'+this.id+'_saturation_include').prop("checked", use.saturation!==undefined);
		q('#'+this.id+'_saturation_not').prop("checked", use.saturation!==undefined&&use.saturation.not);
		q('#'+this.id+'_connectivity_include').prop("checked", use.connectivity!==undefined);
		q('#'+this.id+'_connectivity_value').val(use.connectivity?use.outputRange(use.connectivity.v):'');
		q('#'+this.id+'_connectivity_not').prop("checked", use.connectivity!==undefined&&use.connectivity.not);
		q('#'+this.id+'_connectivityNoH_include').prop("checked", use.connectivityNoH!==undefined);
		q('#'+this.id+'_connectivityNoH_value').val(use.connectivityNoH?use.outputRange(use.connectivityNoH.v):'');
		q('#'+this.id+'_connectivityNoH_not').prop("checked", use.connectivityNoH!==undefined&&use.connectivityNoH.not);
		q('#'+this.id+'_chirality_include').prop("checked", use.chirality!==undefined);
		if(!use.chirality || use.chirality.v === 'R'){
			q('#'+this.id+'_chiral_r').prop('checked', true).button('refresh');
		}else if(!use.chirality || use.chirality.v === 'S'){
			q('#'+this.id+'_chiral_s').prop('checked', true).button('refresh');
		}else if(!use.chirality || use.chirality.v === 'A'){
			q('#'+this.id+'_chiral_a').prop('checked', true).button('refresh');
		}
		q('#'+this.id+'_chirality_not').prop("checked", use.chirality!==undefined&&use.chirality.not);
	};
	_.setup = function() {
		var sb = [];
		sb.push('<div style="font-size:12px;text-align:center;height:300px;overflow-y:scroll;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		sb.push('<p>Set the following form to define the atom query.</p>');
		sb.push('<table>');
		sb.push(makeRow(this.id+'_elements', 'Identity', undefined, 'Select any number of elements and/or wildcards.', '<canvas class="ChemDoodleWebComponent" id="'+this.id+'_pt"></canvas><br><input type="checkbox" id="'+this.id+'_el_any">Any (a)<input type="checkbox" id="'+this.id+'_el_noth">!Hydrogen (r)<input type="checkbox" id="'+this.id+'_el_het">Heteroatom (q)<br><input type="checkbox" id="'+this.id+'_el_hal">Halide (x)<input type="checkbox" id="'+this.id+'_el_met">Metal (m)'));
		sb.push('<tr><td colspan="4"><hr style="width:100%"></td></tr>');
		sb.push(makeRow(this.id+'_aromatic', 'Aromatic', 'A', 'Specifies that the matched atom should be aromatic. Use the NOT modifier to specify not aromatic or anti-aromatic.'));
		sb.push(makeRow(this.id+'_charge', 'Charge', 'C', 'Defines the allowed charge for the matched atom.', 1));
		sb.push(makeRow(this.id+'_hydrogens', 'Hydrogens', 'H', 'Defines the total number of hydrogens attached to the atom, implicit and explicit.', 1));
		sb.push(makeRow(this.id+'_ringCount', 'Ring Count', 'R', 'Defines the total number of rings this atom is a member of. (SSSR)', 1));
		sb.push(makeRow(this.id+'_saturation', 'Saturation', 'S', 'Specifies that the matched atom should be saturated. Use the NOT modifier to specify unsaturation.'));
		sb.push(makeRow(this.id+'_connectivity', 'Connectivity', 'X', 'Defines the total number of bonds connected to the atom, including all hydrogens.', 1));
		sb.push(makeRow(this.id+'_connectivityNoH', 'Connectivity (No H)', 'x', 'Defines the total number of bonds connected to the atom, excluding all hydrogens.', 1));
		sb.push(makeRow(this.id+'_chirality', 'Chirality', '@', 'Defines the stereochemical configuration of the atom.', '<div id="'+this.id+'_radio"><input type="radio" id="'+this.id+'_chiral_a" name="radio"><label for="'+this.id+'_chiral_a">Any (A)</label><input type="radio" id="'+this.id+'_chiral_r" name="radio"><label for="'+this.id+'_chiral_r">Rectus (R)</label><input type="radio" id="'+this.id+'_chiral_s" name="radio"><label for="'+this.id+'_chiral_s">Sinestra (S)</label></div>'));
		sb.push('</table>');
		sb.push('</div>');
		if (document.getElementById(this.id)) {
			var canvas = q('#' + this.id);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		this.periodicTable = new c.PeriodicTableCanvas(this.id + '_pt', 16);
		this.periodicTable.allowMultipleSelections = true;
		this.periodicTable.drawCell = function(ctx, specs, cell){
		    //if hovered, then show a red background
		    if(this.hovered===cell){
		      ctx.fillStyle='blue';
		      ctx.fillRect(cell.x, cell.y, cell.dimension, cell.dimension);
		    }else if(cell.selected){
			    ctx.fillStyle='#c10000';
			    ctx.fillRect(cell.x, cell.y, cell.dimension, cell.dimension);
			}
		    //draw the main cells
		    ctx.strokeStyle='black';
		    ctx.strokeRect(cell.x, cell.y, cell.dimension, cell.dimension);
		    ctx.font = '10px Sans-serif';
		    ctx.fillStyle='black';
		    ctx.textAlign = 'center';
		    ctx.textBaseline = 'middle';
		    ctx.fillText(cell.element.symbol, cell.x+cell.dimension/2, cell.y+cell.dimension/2);
		};
		this.periodicTable.repaint();
		var self = this;
		function setNewQuery(){
			var query = new structures.Query(structures.Query.TYPE_ATOM);
			
			if(q('#'+self.id+'_el_any').is(':checked')){
				query.elements.v.push('a');
			}
			if(q('#'+self.id+'_el_noth').is(':checked')){
				query.elements.v.push('r');
			}
			if(q('#'+self.id+'_el_het').is(':checked')){
				query.elements.v.push('q');
			}
			if(q('#'+self.id+'_el_hal').is(':checked')){
				query.elements.v.push('x');
			}
			if(q('#'+self.id+'_el_met').is(':checked')){
				query.elements.v.push('m');
			}
			for(var i = 0, ii = self.periodicTable.cells.length; i<ii; i++){
				if(self.periodicTable.cells[i].selected){
					query.elements.v.push(self.periodicTable.cells[i].element.symbol);
				}
			}
			if(q('#'+self.id+'_elements_not').is(':checked')){
				query.elements.not = true;
			}
			
			if(q('#'+self.id+'_aromatic_include').is(':checked')){
				query.aromatic = {v:true,not:q('#'+self.id+'_aromatic_not').is(':checked')};
			}
			if(q('#'+self.id+'_charge_include').is(':checked')){
				query.charge = {v:query.parseRange(q('#'+self.id+'_charge_value').val()),not:q('#'+self.id+'_charge_not').is(':checked')};
			}
			if(q('#'+self.id+'_hydrogens_include').is(':checked')){
				query.hydrogens = {v:query.parseRange(q('#'+self.id+'_hydrogens_value').val()),not:q('#'+self.id+'_hydrogens_not').is(':checked')};
			}
			if(q('#'+self.id+'_ringCount_include').is(':checked')){
				query.ringCount = {v:query.parseRange(q('#'+self.id+'_ringCount_value').val()),not:q('#'+self.id+'_ringCount_not').is(':checked')};
			}
			if(q('#'+self.id+'_saturation_include').is(':checked')){
				query.saturation = {v:true,not:q('#'+self.id+'_saturation_not').is(':checked')};
			}
			if(q('#'+self.id+'_connectivity_include').is(':checked')){
				query.connectivity = {v:query.parseRange(q('#'+self.id+'_connectivity_value').val()),not:q('#'+self.id+'_connectivity_not').is(':checked')};
			}
			if(q('#'+self.id+'_connectivityNoH_include').is(':checked')){
				query.connectivityNoH = {v:query.parseRange(q('#'+self.id+'_connectivityNoH_value').val()),not:q('#'+self.id+'_connectivityNoH_not').is(':checked')};
			}
			if(q('#'+self.id+'_chirality_include').is(':checked')){
				var val = 'R';
				if(q('#'+self.id+'_chiral_a').is(':checked')){
					val = 'A';
				}else if(q('#'+self.id+'_chiral_s').is(':checked')){
					val = 'S';
				}
				query.chirality = {v:val,not:q('#'+self.id+'_chirity_not').is(':checked')};
			}
			
			self.sketcher.historyManager.pushUndo(new actions.ChangeQueryAction(self.a, query));
			q(this).dialog('close');
		};
		q('#'+this.id+'_radio').buttonset();
		var self = this;
		this.getElement().dialog({
			autoOpen : false,
			width : 500,
			height: 300,
			buttons : {
				'Cancel' : function(){q(this).dialog('close');},
				'Remove' : function(){self.sketcher.historyManager.pushUndo(new actions.ChangeQueryAction(self.a));q(this).dialog('close');},
				'Set' : setNewQuery
			},
			open : function(event, ui) {
				q("#"+self.id).animate({ scrollTop: 0 }, "fast");
			}
		});
	};

})(ChemDoodle, ChemDoodle.structures, ChemDoodle.uis.actions, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, structures, actions, desktop, imageDepot, q, document) {
	'use strict';

	var makeRow = function(id, name, tag, description, component) {
		var sb = ['<tr>'];
		// checkbox for include
		sb.push('<td>');
		if(id.indexOf('_orders')===-1){
			sb.push('<input type="checkbox" id="');
			sb.push(id);
			sb.push('_include">');
		}
		sb.push('</td>');
		// name and tag
		sb.push('<td>');
		sb.push(name);
		if(tag){
			sb.push('<br>(<strong>');
			sb.push(tag);
			sb.push('</strong>)');
		}
		sb.push('</td>');
		// component
		sb.push('<td style="padding-left:20px;padding-right:20px;">');
		sb.push(description);
		if(component){
			if(component===1){
				sb.push('<br>');
				sb.push('<input type="text" id="');
				sb.push(id);
				sb.push('_value">');
			}else{
				sb.push(component);
			}
		}
		sb.push('</td>');
		// checkbox for not
		sb.push('<td><input type="checkbox" id="');
		sb.push(id);
		sb.push('_not"><br><strong>NOT</strong>');
		sb.push('</td>');
		// close
		sb.push('</tr>');
		return sb.join('');
	};
	
	desktop.BondQueryDialog = function(sketcher, subid) {
		this.sketcher = sketcher;
		this.id = sketcher.id + subid;
	};
	var _ = desktop.BondQueryDialog.prototype = new desktop.Dialog();
	_.title = 'Bond Query';
	_.setBond = function(b) {
		this.b = b;
		var use = b.query;
		if(!use){
			use = new structures.Query(structures.Query.TYPE_BOND);
			switch(b.bondOrder){
			case 0:
				use.orders.v.push('0');
				break;
			case 0.5:
				use.orders.v.push('h');
				break;
			case 1:
				use.orders.v.push('1');
				break;
			case 1.5:
				use.orders.v.push('r');
				break;
			case 2:
				use.orders.v.push('2');
				break;
			case 3:
				use.orders.v.push('3');
				break;
			}
		}
		
		q('#'+this.id+'_type_0').prop("checked", use.orders.v.indexOf('0')!==-1).button('refresh');
		q('#'+this.id+'_type_1').prop("checked", use.orders.v.indexOf('1')!==-1).button('refresh');
		q('#'+this.id+'_type_2').prop("checked", use.orders.v.indexOf('2')!==-1).button('refresh');
		q('#'+this.id+'_type_3').prop("checked", use.orders.v.indexOf('3')!==-1).button('refresh');
		q('#'+this.id+'_type_4').prop("checked", use.orders.v.indexOf('4')!==-1).button('refresh');
		q('#'+this.id+'_type_5').prop("checked", use.orders.v.indexOf('5')!==-1).button('refresh');
		q('#'+this.id+'_type_6').prop("checked", use.orders.v.indexOf('6')!==-1).button('refresh');
		q('#'+this.id+'_type_h').prop("checked", use.orders.v.indexOf('h')!==-1).button('refresh');
		q('#'+this.id+'_type_r').prop("checked", use.orders.v.indexOf('r')!==-1).button('refresh');
		q('#'+this.id+'_type_a').prop("checked", use.orders.v.indexOf('a')!==-1).button('refresh');
		q('#'+this.id+'_orders_not').prop("checked", use.orders.not);
		
		q('#'+this.id+'_aromatic_include').prop("checked", use.aromatic!==undefined);
		q('#'+this.id+'_aromatic_not').prop("checked", use.aromatic!==undefined&&use.aromatic.not);
		q('#'+this.id+'_ringCount_include').prop("checked", use.ringCount!==undefined);
		q('#'+this.id+'_ringCount_value').val(use.ringCount?use.outputRange(use.ringCount.v):'');
		q('#'+this.id+'_ringCount_not').prop("checked", use.ringCount!==undefined&&use.ringCount.not);
		q('#'+this.id+'_stereo_include').prop("checked", use.stereo!==undefined);
		if(!use.stereo || use.stereo.v === 'E'){
			q('#'+this.id+'_stereo_e').prop('checked', true).button('refresh');
		}else if(!use.stereo || use.stereo.v === 'Z'){
			q('#'+this.id+'_stereo_z').prop('checked', true).button('refresh');
		}else if(!use.stereo || use.stereo.v === 'A'){
			q('#'+this.id+'_stereo_a').prop('checked', true).button('refresh');
		}
		q('#'+this.id+'_stereo_not').prop("checked", use.stereo!==undefined&&use.stereo.not);
	};
	_.setup = function() {
		var sb = [];
		sb.push('<div style="font-size:12px;text-align:center;height:300px;overflow-y:scroll;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		sb.push('<p>Set the following form to define the bond query.</p>');
		sb.push('<table>');
		sb.push(makeRow(this.id+'_orders', 'Identity', undefined, 'Select any number of bond types.', '<div id="'+this.id+'_radioTypes"><input type="checkbox" id="'+this.id+'_type_0"><label for="'+this.id+'_type_0"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_ZERO)+'" /></label><input type="checkbox" id="'+this.id+'_type_1"><label for="'+this.id+'_type_1"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_SINGLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_2"><label for="'+this.id+'_type_2"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_DOUBLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_3"><label for="'+this.id+'_type_3"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_TRIPLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_4"><label for="'+this.id+'_type_4"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_QUADRUPLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_5"><label for="'+this.id+'_type_5"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_QUINTUPLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_6"><label for="'+this.id+'_type_6"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_SEXTUPLE)+'" /></label><input type="checkbox" id="'+this.id+'_type_h"><label for="'+this.id+'_type_h"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_HALF)+'" /></label><input type="checkbox" id="'+this.id+'_type_r"><label for="'+this.id+'_type_r"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_RESONANCE)+'" /></label><input type="checkbox" id="'+this.id+'_type_a"><label for="'+this.id+'_type_a"><img width="20" height="20" src="'+imageDepot.getURI(imageDepot.BOND_ANY)+'" /></label></div>'));
		sb.push('<tr><td colspan="4"><hr style="width:100%"></td></tr>');
		sb.push(makeRow(this.id+'_aromatic', 'Aromatic', 'A', 'Specifies that the matched bond should be aromatic. Use the NOT modifier to specify not aromatic or anti-aromatic.'));
		sb.push(makeRow(this.id+'_ringCount', 'Ring Count', 'R', 'Defines the total number of rings this bond is a member of. (SSSR)', 1));
		sb.push(makeRow(this.id+'_stereo', 'Stereochemistry', '@', 'Defines the stereochemical configuration of the bond.', '<div id="'+this.id+'_radio"><input type="radio" id="'+this.id+'_stereo_a" name="radio"><label for="'+this.id+'_stereo_a">Any (A)</label><input type="radio" id="'+this.id+'_stereo_e" name="radio"><label for="'+this.id+'_stereo_e">Entgegen (E)</label><input type="radio" id="'+this.id+'_stereo_z" name="radio"><label for="'+this.id+'_stereo_z">Zusammen (Z)</label></div>'));
		sb.push('</table>');
		sb.push('</div>');
		if (document.getElementById(this.id)) {
			var canvas = q('#' + this.id);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		var self = this;
		function setNewQuery(){
			var query = new structures.Query(structures.Query.TYPE_BOND);

			if(q('#'+self.id+'_type_0').is(':checked')){
				query.orders.v.push('0');
			}
			if(q('#'+self.id+'_type_1').is(':checked')){
				query.orders.v.push('1');
			}
			if(q('#'+self.id+'_type_2').is(':checked')){
				query.orders.v.push('2');
			}
			if(q('#'+self.id+'_type_3').is(':checked')){
				query.orders.v.push('3');
			}
			if(q('#'+self.id+'_type_4').is(':checked')){
				query.orders.v.push('4');
			}
			if(q('#'+self.id+'_type_5').is(':checked')){
				query.orders.v.push('5');
			}
			if(q('#'+self.id+'_type_6').is(':checked')){
				query.orders.v.push('6');
			}
			if(q('#'+self.id+'_type_h').is(':checked')){
				query.orders.v.push('h');
			}
			if(q('#'+self.id+'_type_r').is(':checked')){
				query.orders.v.push('r');
			}
			if(q('#'+self.id+'_type_a').is(':checked')){
				query.orders.v.push('a');
			}
			if(q('#'+self.id+'_orders_not').is(':checked')){
				query.orders.not = true;
			}
			
			if(q('#'+self.id+'_aromatic_include').is(':checked')){
				query.aromatic = {v:true,not:q('#'+self.id+'_aromatic_not').is(':checked')};
			}
			if(q('#'+self.id+'_ringCount_include').is(':checked')){
				query.ringCount = {v:query.parseRange(q('#'+self.id+'_ringCount_value').val()),not:q('#'+self.id+'_ringCount_not').is(':checked')};
			}
			if(q('#'+self.id+'_stereo_include').is(':checked')){
				var val = 'E';
				if(q('#'+self.id+'_stereo_a').is(':checked')){
					val = 'A';
				}else if(q('#'+self.id+'_stereo_z').is(':checked')){
					val = 'Z';
				}
				query.stereo = {v:val,not:q('#'+self.id+'_stereo_not').is(':checked')};
			}
			
			self.sketcher.historyManager.pushUndo(new actions.ChangeQueryAction(self.b, query));
			q(this).dialog('close');
		};
		q('#'+this.id+'_radioTypes').buttonset();
		q('#'+this.id+'_radio').buttonset();
		this.getElement().dialog({
			autoOpen : false,
			width : 520,
			height: 300,
			buttons : {
				'Cancel' : function(){q(this).dialog('close');},
				'Remove' : function(){self.sketcher.historyManager.pushUndo(new actions.ChangeQueryAction(self.b));q(this).dialog('close');},
				'Set' : setNewQuery
			},
			open : function(event, ui) {
				q("#"+self.id).animate({ scrollTop: 0 }, "fast");
			}
		});
	};

})(ChemDoodle, ChemDoodle.structures, ChemDoodle.uis.actions, ChemDoodle.uis.gui.desktop, ChemDoodle.uis.gui.imageDepot, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, desktop, q, document) {
	'use strict';
	desktop.MolGrabberDialog = function(sketcherid, subid) {
		this.sketcherid = sketcherid;
		this.id = sketcherid + subid;
	};
	var _ = desktop.MolGrabberDialog.prototype = new desktop.Dialog();
	_.title = 'MolGrabber';
	_.setup = function() {
		var sb = [];
		sb.push('<div style="font-size:12px;text-align:center;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		if (this.message) {
			sb.push('<p>');
			sb.push(this.message);
			sb.push('</p>');
		}
		// Next is the MolGrabberCanvas, whose constructor will be called AFTER
		// the elements are in the DOM.
		sb.push('<canvas class="ChemDoodleWebComponent" id="');
		sb.push(this.id);
		sb.push('_mg"></canvas>');
		if (this.afterMessage) {
			sb.push('<p>');
			sb.push(this.afterMessage);
			sb.push('</p>');
		}
		sb.push('</div>');
		if (document.getElementById(this.sketcherid)) {
			var canvas = q('#' + this.sketcherid);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		this.canvas = new c.MolGrabberCanvas(this.id + '_mg', 200, 200);
		this.canvas.specs.backgroundColor = '#fff';
		this.canvas.repaint();
		var self = this;
		this.getElement().dialog({
			autoOpen : false,
			width : 250,
			buttons : self.buttons
		});
	};

})(ChemDoodle, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, desktop, q, document) {
	'use strict';
	desktop.PeriodicTableDialog = function(sketcherid, subid) {
		this.sketcherid = sketcherid;
		this.id = sketcherid + subid;
	};
	var _ = desktop.PeriodicTableDialog.prototype = new desktop.Dialog();
	_.title = 'Periodic Table';
	_.setup = function() {
		var sb = [];
		sb.push('<div style="text-align:center;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		sb.push('<canvas class="ChemDoodleWebComponents" id="');
		sb.push(this.id);
		sb.push('_pt"></canvas></div>');
		if (document.getElementById(this.sketcherid)) {
			var canvas = q('#' + this.sketcherid);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		this.canvas = new ChemDoodle.PeriodicTableCanvas(this.id + '_pt', 20);
		var self = this;
		this.getElement().dialog({
			autoOpen : false,
			width : 400,
			buttons : self.buttons
		});
	};

})(ChemDoodle, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, desktop, q, document) {
	'use strict';
	desktop.SaveFileDialog = function(id, sketcher) {
		this.id = id;
		this.sketcher = sketcher;
	};
	var _ = desktop.SaveFileDialog.prototype = new desktop.Dialog();
	_.title = 'Save File';
	_.clear = function() {
		q('#' + this.id + '_link').html('The file link will appear here.');
	};
	_.setup = function() {
		var sb = [];
		sb.push('<div style="font-size:12px;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		sb.push('<p>Select the file format to save your structure to and click on the <strong>Generate File</strong> button.</p>');
		sb.push('<select id="');
		sb.push(this.id);
		sb.push('_select">');
		sb.push('<option value="sk2">ACD/ChemSketch Document {sk2}');
		sb.push('<option value="ros">Beilstein ROSDAL {ros}');
		sb.push('<option value="cdx">Cambridgesoft ChemDraw Exchange {cdx}');
		sb.push('<option value="cdxml">Cambridgesoft ChemDraw XML {cdxml}');
		sb.push('<option value="mrv">ChemAxon Marvin Document {mrv}');
		sb.push('<option value="cml">Chemical Markup Language {cml}');
		sb.push('<option value="smiles">Daylight SMILES {smiles}');
		sb.push('<option value="icl" selected>iChemLabs ChemDoodle Document {icl}');
		sb.push('<option value="inchi">IUPAC InChI {inchi}');
		sb.push('<option value="jdx">IUPAC JCAMP-DX {jdx}');
		sb.push('<option value="skc">MDL ISIS Sketch {skc}');
		sb.push('<option value="tgf">MDL ISIS Sketch Transportable Graphics File {tgf}');
		sb.push('<option value="mol">MDL MOLFile {mol}');
		// sb.push('<option value="rdf">MDL RDFile {rdf}');
		// sb.push('<option value="rxn">MDL RXNFile {rxn}');
		sb.push('<option value="sdf">MDL SDFile {sdf}');
		sb.push('<option value="jme">Molinspiration JME String {jme}');
		sb.push('<option value="pdb">RCSB Protein Data Bank {pdb}');
		sb.push('<option value="mmd">Schr&ouml;dinger Macromodel {mmd}');
		sb.push('<option value="mae">Schr&ouml;dinger Maestro {mae}');
		sb.push('<option value="smd">Standard Molecular Data {smd}');
		sb.push('<option value="mol2">Tripos Mol2 {mol2}');
		sb.push('<option value="sln">Tripos SYBYL SLN {sln}');
		sb.push('<option value="xyz">XYZ {xyz}');
		sb.push('</select>');
		sb.push('<button id="');
		sb.push(this.id);
		sb.push('_button">');
		sb.push('Generate File</button>');
		sb.push('<p>When the file is written, a link will appear in the red-bordered box below, right-click on the link and choose the browser\'s <strong>Save As...</strong> function to save the file to your computer.</p>');
		sb.push('<div style="width:100%;height:30px;border:1px solid #c10000;text-align:center;" id="');
		sb.push(this.id);
		sb.push('_link">The file link will appear here.</div>');
		sb.push('<p><a href="http://www.chemdoodle.com" target="_blank">How do I use these files?</a></p>');
		sb.push('</div>');
		if (document.getElementById(this.sketcher.id)) {
			var canvas = q('#' + this.sketcher.id);
			canvas.before(sb.join(''));
		} else {
			document.writeln(sb.join(''));
		}
		var self = this;
		q('#' + this.id + '_button').click(function() {
			q('#' + self.id + '_link').html('Generating file, please wait...');
			ChemDoodle.iChemLabs.saveFile(self.sketcher.oneMolecule ? self.sketcher.molecules[0] : self.sketcher.lasso.getFirstMolecule(), {
				ext : q('#' + self.id + '_select').val()
			}, function(link) {
				q('#' + self.id + '_link').html('<a href="' + link + '"><span style="text-decoration:underline;">File is generated. Right-click on this link and Save As...</span></a>');
			});
		});
		this.getElement().dialog({
			autoOpen : false,
			width : 435,
			buttons : self.buttons
		});
	};

})(ChemDoodle, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, actions, gui, desktop, q) {
	'use strict';
	gui.DialogManager = function(sketcher) {
		if (sketcher.useServices) {
			this.saveDialog = new desktop.SaveFileDialog(sketcher.id + '_save_dialog', sketcher);
		} else {
			this.saveDialog = new desktop.Dialog(sketcher.id, '_save_dialog', 'Save Molecule');
			this.saveDialog.message = 'Copy and paste the content of the textarea into a file and save it with the extension <strong>.mol</strong>.';
			this.saveDialog.includeTextArea = true;
			// You must keep this link displayed at all times to abide by the
			// license
			// Contact us for permission to remove it,
			// http://www.ichemlabs.com/contact-us
			this.saveDialog.afterMessage = '<a href="http://www.chemdoodle.com" target="_blank">How do I use MOLFiles?</a>';
		}
		this.saveDialog.setup();

		this.loadDialog = new desktop.Dialog(sketcher.id, '_load_dialog', 'Load Molecule');
		var sb = [ 'Copy and paste the contents of a MOLFile (<strong>.mol</strong>)' ];
		// if (sketcher.useServices) {
		// sb.push(', a SMILES string');
		// }
		sb.push(' or ChemDoodle JSON in the textarea below and then press the <strong>Load</strong> button.');
		this.loadDialog.message = sb.join('');
		this.loadDialog.includeTextArea = true;
		// You must keep this link displayed at all times to abide by the
		// license
		// Contact us for permission to remove it,
		// http://www.ichemlabs.com/contact-us
		this.loadDialog.afterMessage = '<a href="http://www.chemdoodle.com" target="_blank">Where do I get MOLFiles or ChemDoodle JSON?</a>';
		var self = this;
		this.loadDialog.buttons = {
			'Load' : function() {
				q(this).dialog('close');
				var s = self.loadDialog.getTextArea().val();
				var newContent;
				if (s.indexOf('v2000') !== -1 || s.indexOf('V2000') !== -1) {
					newContent = {
						molecules : [ c.readMOL(s) ],
						shapes : []
					};
				} else if (s.charAt(0) == '{') {
					newContent = new c.readJSON(s);
				}
				if (sketcher.oneMolecule && newContent && newContent.molecules.length > 0 && newContent.molecules[0].atoms.length > 0) {
					sketcher.historyManager.pushUndo(new actions.SwitchMoleculeAction(sketcher, newContent.molecules[0]));
				} else if (!sketcher.oneMolecule && newContent && (newContent.molecules.length > 0 || newContent.shapes.length > 0)) {
					sketcher.historyManager.pushUndo(new actions.SwitchContentAction(sketcher, newContent.molecules, newContent.shapes));
				} else {
					alert('No chemical content was recognized.');
				}
			}
		};
		this.loadDialog.setup();

		this.atomQueryDialog = new desktop.AtomQueryDialog(sketcher, '_atom_query_dialog');
		this.atomQueryDialog.setup();

		this.bondQueryDialog = new desktop.BondQueryDialog(sketcher, '_bond_query_dialog');
		this.bondQueryDialog.setup();

		this.searchDialog = new desktop.MolGrabberDialog(sketcher.id, '_search_dialog');
		this.searchDialog.buttons = {
			'Load' : function() {
				q(this).dialog('close');
				var newMol = self.searchDialog.canvas.molecules[0];
				if (newMol && newMol.atoms.length > 0) {
					if (sketcher.oneMolecule) {
						if (newMol !== sketcher.molecule) {
							sketcher.historyManager.pushUndo(new actions.SwitchMoleculeAction(sketcher, newMol));
						}
					} else {
						sketcher.historyManager.pushUndo(new actions.NewMoleculeAction(sketcher, newMol.atoms, newMol.bonds));
						sketcher.toolbarManager.buttonLasso.getElement().click();
						sketcher.lasso.select(newMol.atoms, []);
					}
				}
			}
		};
		this.searchDialog.setup();

		if (sketcher.setupScene) {
			this.specsDialog = new desktop.SpecsDialog(sketcher, '_specs_dialog');
			this.specsDialog.buttons = {
				'Done' : function() {
					q(this).dialog('close');
				}
			};
			this.specsDialog.setup(this.specsDialog, sketcher);
		}

		this.periodicTableDialog = new desktop.PeriodicTableDialog(sketcher.id, '_periodicTable_dialog');
		this.periodicTableDialog.buttons = {
			'Close' : function() {
				q(this).dialog('close');
			}
		};
		this.periodicTableDialog.setup();
		this.periodicTableDialog.canvas.click = function(evt) {
			if (this.hovered) {
				this.selected = this.hovered;
				var e = this.getHoveredElement();
				sketcher.stateManager.setState(sketcher.stateManager.STATE_LABEL);
				sketcher.stateManager.STATE_LABEL.label = e.symbol;
				sketcher.toolbarManager.buttonLabel.select();
				this.repaint();
			}
		};

		this.calculateDialog = new desktop.Dialog(sketcher.id, '_calculate_dialog', 'Calculations');
		this.calculateDialog.includeTextArea = true;
		// You must keep this link displayed at all times to abide by the
		// license
		// Contact us for permission to remove it,
		// http://www.ichemlabs.com/contact-us
		this.calculateDialog.afterMessage = '<a href="http://www.chemdoodle.com" target="_blank">Want more calculations?</a>';
		this.calculateDialog.setup();

		this.inputDialog = new desktop.Dialog(sketcher.id, '_input_dialog', 'Input');
		this.inputDialog.message = 'Please input the rgroup number (must be a positive integer). Input "-1" to remove the rgroup.';
		this.inputDialog.includeTextField = true;
		this.inputDialog.buttons = {
			'Done' : function() {
				q(this).dialog('close');
				if (self.inputDialog.doneFunction) {
					self.inputDialog.doneFunction(self.inputDialog.getTextField().val());
				}
			}
		};
		this.inputDialog.setup();
	};

})(ChemDoodle, ChemDoodle.uis.actions, ChemDoodle.uis.gui, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(desktop, imageDepot, q, document) {
	'use strict';
	desktop.DropDown = function(id, tooltip, dummy) {
		this.id = id;
		this.tooltip = tooltip;
		this.dummy = dummy;
		this.buttonSet = new desktop.ButtonSet(id + '_set');
		this.buttonSet.buttonGroup = tooltip;
		this.defaultButton = undefined;
	};
	var _ = desktop.DropDown.prototype;
	_.getButtonSource = function() {
		var sb = [];
		sb.push('<button id="');
		sb.push(this.id);
		sb.push('" onclick="return false;" title="');
		sb.push(this.tooltip);
		sb.push('"><img title="');
		sb.push(this.tooltip);
		sb.push('" width="9" height="20" src="');
		sb.push(imageDepot.getURI(imageDepot.ARROW_DOWN));
		sb.push('"></button>');
		return sb.join('');
	};
	_.getHiddenSource = function() {
		var sb = [];
		sb.push('<div style="display:none;position:absolute;z-index:10;border:1px #C1C1C1 solid;background:#F5F5F5;padding:5px;border-bottom-left-radius:5px;-moz-border-radius-bottomleft:5px;border-bottom-right-radius:5px;-moz-border-radius-bottomright:5px;" id="');
		sb.push(this.id);
		sb.push('_hidden">');
		sb.push(this.buttonSet.getSource(this.id + '_popup_set'));
		sb.push('</div>');
		return sb.join('');
	};
	_.setup = function() {
		if (!this.defaultButton) {
			this.defaultButton = this.buttonSet.buttons[0];
		}
		var tag = '#' + this.id;
		q(tag).button();
		q(tag + '_hidden').hide();
		q(tag).click(function() {
			// mobile safari doesn't allow clicks to be triggered
			q(document).trigger('click');
			var component = q(tag + '_hidden');
			component.show().position({
				my : 'center top',
				at : 'center bottom',
				of : this,
				collision : 'fit'
			});
			q(document).one('click', function() {
				component.hide();
			});
			return false;
		});
		this.buttonSet.setup();
		var self = this;
		q.each(this.buttonSet.buttons, function(index, value) {
			self.buttonSet.buttons[index].getElement().click(function() {
				self.dummy.absorb(self.buttonSet.buttons[index]);
				self.dummy.select();
				self.dummy.func();
			});
		});
		self.dummy.absorb(this.defaultButton);
		this.defaultButton.select();
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.uis.gui.imageDepot, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(desktop, imageDepot, q) {
	'use strict';
	desktop.DummyButton = function(id, icon, tooltip) {
		this.id = id;
		this.icon = icon;
		this.toggle = false;
		this.tooltip = tooltip ? tooltip : '';
		this.func = undefined;
	};
	var _ = desktop.DummyButton.prototype = new desktop.Button();
	_.setup = function() {
		var self = this;
		this.getElement().click(function() {
			self.func();
		});
	};
	_.absorb = function(button) {
		q('#' + this.id + '_icon').attr('src', imageDepot.getURI(button.icon));
		this.func = button.func;
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.uis.gui.imageDepot, ChemDoodle.lib.jQuery);
//
// Copyright 2009-2015 iChemLabs, LLC. All rights reserved.
//
(function(desktop, q) {
	'use strict';
	desktop.TextButton = function(id, tooltip, func) {
		this.id = id;
		this.toggle = false;
		this.tooltip = tooltip ? tooltip : '';
		this.func = func ? func : undefined;
	};
	var _ = desktop.TextButton.prototype = new desktop.Button();
	_.getSource = function(buttonGroup) {
		var sb = [];
		if (this.toggle) {
			sb.push('<input type="radio" name="');
			sb.push(buttonGroup);
			sb.push('" id="');
			sb.push(this.id);
			sb.push('" title="');
			sb.push(this.tooltip);
			sb.push('" /><label for="');
			sb.push(this.id);
			sb.push('">');
			sb.push(this.tooltip);
			sb.push('</label>');
		} else {
			sb.push('<button id="');
			sb.push(this.id);
			sb.push('" onclick="return false;" title="');
			sb.push(this.tooltip);
			sb.push('"><label for="');
			sb.push(this.id);
			sb.push('">');
			sb.push(this.tooltip);
			sb.push('</label></button>');
		}
		return sb.join('');
	};
	
	_.check = function() {
		var element = this.getElement();
		element.prop('checked', true);
		element.button('refresh');
	};
	
	_.uncheck = function() {
		var element = this.getElement();
		element.removeAttr('checked');
		element.button('refresh');
	};

})(ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(c, iChemLabs, io, structures, actions, gui, imageDepot, desktop, tools, states, q, document) {
	'use strict';
	gui.ToolbarManager = function(sketcher) {
		this.sketcher = sketcher;

		// open
		this.buttonOpen = new desktop.Button(sketcher.id + '_button_open', imageDepot.OPEN, 'Open', function() {
			sketcher.dialogManager.loadDialog.getTextArea().val('');
			sketcher.dialogManager.loadDialog.getElement().dialog('open');
		});
		// save
		this.buttonSave = new desktop.Button(sketcher.id + '_button_save', imageDepot.SAVE, 'Save', function() {
			if (sketcher.useServices) {
				sketcher.dialogManager.saveDialog.clear();
			} else if (sketcher.oneMolecule) {
				sketcher.dialogManager.saveDialog.getTextArea().val(c.writeMOL(sketcher.molecules[0]));
			} else if (sketcher.lasso.isActive()) {
				sketcher.dialogManager.saveDialog.getTextArea().val(c.writeMOL(sketcher.lasso.getFirstMolecule()));
			}
			sketcher.dialogManager.saveDialog.getElement().dialog('open');
		});
		// search
		this.buttonSearch = new desktop.Button(sketcher.id + '_button_search', imageDepot.SEARCH, 'Search', function() {
			sketcher.dialogManager.searchDialog.getElement().dialog('open');
		});
		// calculate
		this.buttonCalculate = new desktop.Button(sketcher.id + '_button_calculate', imageDepot.CALCULATE, 'Calculate', function() {
			var mol = sketcher.oneMolecule ? sketcher.molecules[0] : sketcher.lasso.getFirstMolecule();
			if (mol) {
				iChemLabs.calculate(mol, {
					descriptors : [ 'mf', 'ef', 'mw', 'miw', 'deg_unsat', 'hba', 'hbd', 'rot', 'electron', 'pol_miller', 'cmr', 'tpsa', 'vabc', 'xlogp2', 'bertz' ]
				}, function(content) {
					var sb = [];
					function addDatum(title, value, unit) {
						sb.push(title);
						sb.push(': ');
						for ( var i = title.length + 2; i < 30; i++) {
							sb.push(' ');
						}
						sb.push(value);
						sb.push(' ');
						sb.push(unit);
						sb.push('\n');
					}
					addDatum('Molecular Formula', content.mf, '');
					addDatum('Empirical Formula', content.ef, '');
					addDatum('Molecular Mass', content.mw, 'amu');
					addDatum('Monoisotopic Mass', content.miw, 'amu');
					addDatum('Degree of Unsaturation', content.deg_unsat, '');
					addDatum('Hydrogen Bond Acceptors', content.hba, '');
					addDatum('Hydrogen Bond Donors', content.hbd, '');
					addDatum('Rotatable Bonds', content.rot, '');
					addDatum('Total Electrons', content.rot, '');
					addDatum('Molecular Polarizability', content.pol_miller, 'A^3');
					addDatum('Molar Refractivity', content.cmr, 'cm^3/mol');
					addDatum('Polar Surface Area', content.tpsa, 'A^2');
					addDatum('vdW Volume', content.vabc, 'A^3');
					addDatum('logP', content.xlogp2, '');
					addDatum('Complexity', content.bertz, '');
					sketcher.dialogManager.calculateDialog.getTextArea().val(sb.join(''));
					sketcher.dialogManager.calculateDialog.getElement().dialog('open');
				});
			}
		});

		// move
		this.buttonMove = new desktop.Button(sketcher.id + '_button_move', imageDepot.MOVE, 'Move', function() {
			sketcher.stateManager.setState(sketcher.stateManager.STATE_MOVE);
		});
		this.buttonMove.toggle = true;
		// erase
		this.buttonErase = new desktop.Button(sketcher.id + '_button_erase', imageDepot.ERASE, 'Erase', function() {
			sketcher.stateManager.setState(sketcher.stateManager.STATE_ERASE);
		});
		this.buttonErase.toggle = true;

		// clear
		this.buttonClear = new desktop.Button(sketcher.id + '_button_clear', imageDepot.CLEAR, 'Clear', function() {
			var clear = true;
			if (sketcher.oneMolecule) {
				if (sketcher.molecules[0].atoms.length === 1) {
					var a = sketcher.molecules[0].atoms[0];
					if (a.label === 'C' && a.charge === 0 && a.mass === -1) {
						clear = false;
					}
				}
			} else {
				if (sketcher.molecules.length === 0 && sketcher.shapes.length === 0) {
					clear = false;
				}
			}
			if (clear) {
				sketcher.stateManager.getCurrentState().clearHover();
				if (sketcher.lasso && sketcher.lasso.isActive()) {
					sketcher.lasso.empty();
				}
				sketcher.historyManager.pushUndo(new actions.ClearAction(sketcher));
			}
		});
		// clean
		this.buttonClean = new desktop.Button(sketcher.id + '_button_clean', imageDepot.OPTIMIZE, 'Clean', function() {
			var mol = sketcher.oneMolecule ? sketcher.molecules[0] : sketcher.lasso.getFirstMolecule();
			if (mol) {
				var json = new io.JSONInterpreter();
				iChemLabs._contactServer('optimize', {
					'mol' : json.molTo(mol)
				}, {
					dimension : 2
				}, function(content) {
					var optimized = json.molFrom(content.mol);
					var optCenter = optimized.getCenter();
					var dif = sketcher.oneMolecule ? new structures.Point(sketcher.width / 2, sketcher.height / 2) : mol.getCenter();
					dif.sub(optCenter);
					for ( var i = 0, ii = optimized.atoms.length; i < ii; i++) {
						optimized.atoms[i].add(dif);
					}
					sketcher.historyManager.pushUndo(new actions.ChangeCoordinatesAction(mol.atoms, optimized.atoms));
				});
			}
		});

		// lasso set
		this.makeLassoSet(this);

		// scale set
		this.makeScaleSet(this);

		// history set
		this.makeHistorySet(this);

		// label set
		this.makeLabelSet(this);
		
		// query
		this.buttonQuery = new desktop.Button(sketcher.id + '_button_query', imageDepot.QUERY, 'Set Query to Atom or Bond', function() {
			sketcher.stateManager.setState(sketcher.stateManager.STATE_QUERY);
		});
		this.buttonQuery.toggle = true;

		// bond set
		this.makeBondSet(this);

		// ring set
		this.makeRingSet(this);

		// attribute set
		this.makeAttributeSet(this);

		// shape set
		this.makeShapeSet(this);
	};
	var _ = gui.ToolbarManager.prototype;
	_.write = function() {
		var sb = ['<div style="font-size:10px;">'];
		var bg = this.sketcher.id + '_main_group';
		if (this.sketcher.oneMolecule) {
			sb.push(this.buttonMove.getSource(bg));
		} else {
			sb.push(this.lassoSet.getSource(bg));
		}
		sb.push(this.buttonClear.getSource());
		sb.push(this.buttonErase.getSource(bg));
		if (this.sketcher.useServices) {
			sb.push(this.buttonClean.getSource());
		}
		sb.push(this.historySet.getSource());
		sb.push(this.scaleSet.getSource());
		sb.push(this.buttonOpen.getSource());
		sb.push(this.buttonSave.getSource());
		if (this.sketcher.useServices) {
			sb.push(this.buttonSearch.getSource());
			sb.push(this.buttonCalculate.getSource());
		}
		sb.push('<br>');
		sb.push(this.labelSet.getSource(bg));
		if (this.sketcher.includeQuery) {
			sb.push(this.buttonQuery.getSource(bg));
		}
		sb.push(this.attributeSet.getSource(bg));
		sb.push(this.bondSet.getSource(bg));
		sb.push(this.ringSet.getSource(bg));
		if (!this.sketcher.oneMolecule) {
			sb.push(this.shapeSet.getSource(bg));
		}
		sb.push('</div>');

		if (document.getElementById(this.sketcher.id)) {
			var canvas = q('#' + this.sketcher.id);
			canvas.before(sb.join(''));
		} else {
			document.write(sb.join(''));
		}
	};
	_.setup = function() {
		if (this.sketcher.oneMolecule) {
			this.buttonMove.setup(true);
		} else {
			this.lassoSet.setup();
		}
		this.buttonClear.setup();
		this.buttonErase.setup(true);
		if (this.sketcher.useServices) {
			this.buttonClean.setup();
		}
		this.historySet.setup();
		this.scaleSet.setup();
		this.buttonOpen.setup();
		this.buttonSave.setup();
		if (this.sketcher.useServices) {
			this.buttonSearch.setup();
			this.buttonCalculate.setup();
		}
		this.labelSet.setup();
		if (this.sketcher.includeQuery) {
			this.buttonQuery.setup(true);
		}
		this.attributeSet.setup();
		this.bondSet.setup();
		this.ringSet.setup();
		if (!this.sketcher.oneMolecule) {
			this.shapeSet.setup();
		}

		this.buttonSingle.select();
		this.buttonUndo.disable();
		this.buttonRedo.disable();
		if (!this.sketcher.oneMolecule) {
			if (this.sketcher.useServices) {
				this.buttonClean.disable();
				this.buttonCalculate.disable();
				this.buttonSave.disable();
			}
		}
	};

	_.makeScaleSet = function(self) {
		this.scaleSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_scale');
		this.scaleSet.toggle = false;
		this.buttonScalePlus = new desktop.Button(self.sketcher.id + '_button_scale_plus', imageDepot.ZOOM_IN, 'Increase Scale', function() {
			self.sketcher.specs.scale *= 1.5;
			self.sketcher.checkScale();
			self.sketcher.repaint();
		});
		this.scaleSet.buttons.push(this.buttonScalePlus);
		this.buttonScaleMinus = new desktop.Button(self.sketcher.id + '_button_scale_minus', imageDepot.ZOOM_OUT, 'Decrease Scale', function() {
			self.sketcher.specs.scale /= 1.5;
			self.sketcher.checkScale();
			self.sketcher.repaint();
		});
		this.scaleSet.buttons.push(this.buttonScaleMinus);
	};
	_.makeLassoSet = function(self) {
		this.lassoSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_lasso');
		this.buttonLasso = new desktop.DummyButton(self.sketcher.id + '_button_lasso', imageDepot.LASSO, 'Selection Tool');
		this.lassoSet.buttons.push(this.buttonLasso);
		this.lassoSet.addDropDown('More Selection Tools');
		this.lassoSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_lasso_lasso', imageDepot.LASSO, 'Lasso Tool', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LASSO);
			self.sketcher.lasso.mode = tools.Lasso.MODE_LASSO;
			if (self.sketcher.molecules.length > 0 && !self.sketcher.lasso.isActive()) {
				self.sketcher.lasso.select(self.sketcher.molecules[self.sketcher.molecules.length - 1].atoms, []);
			}
		}));
		this.lassoSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_lasso_shapes', imageDepot.LASSO_SHAPES, 'Lasso Tool (shapes only)', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LASSO);
			self.sketcher.lasso.mode = tools.Lasso.MODE_LASSO_SHAPES;
			if (self.sketcher.shapes.length > 0 && !self.sketcher.lasso.isActive()) {
				self.sketcher.lasso.select([], [ self.sketcher.shapes[self.sketcher.shapes.length - 1] ]);
			}
		}));
		this.lassoSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_lasso_marquee', imageDepot.MARQUEE, 'Marquee Tool', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LASSO);
			self.sketcher.lasso.mode = tools.Lasso.MODE_RECTANGLE_MARQUEE;
			if (self.sketcher.molecules.length > 0 && !self.sketcher.lasso.isActive()) {
				self.sketcher.lasso.select(self.sketcher.molecules[self.sketcher.molecules.length - 1].atoms, []);
			}
		}));
	};
	_.makeHistorySet = function(self) {
		this.historySet = new desktop.ButtonSet(self.sketcher.id + '_buttons_history');
		this.historySet.toggle = false;
		this.buttonUndo = new desktop.Button(self.sketcher.id + '_button_undo', imageDepot.UNDO, 'Undo', function() {
			self.sketcher.historyManager.undo();
		});
		this.historySet.buttons.push(this.buttonUndo);
		this.buttonRedo = new desktop.Button(self.sketcher.id + '_button_redo', imageDepot.REDO, 'Redo', function() {
			self.sketcher.historyManager.redo();
		});
		this.historySet.buttons.push(this.buttonRedo);
	};
	_.makeLabelSet = function(self) {
		this.labelSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_label');
		this.buttonLabel = new desktop.DummyButton(self.sketcher.id + '_button_label', imageDepot.CARBON, 'Set Label');
		this.labelSet.buttons.push(this.buttonLabel);
		this.labelSet.addDropDown('More Labels');
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_h', imageDepot.HYDROGEN, 'Hydrogen', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'H';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_c', imageDepot.CARBON, 'Carbon', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'C';
		}));
		this.labelSet.dropDown.defaultButton = this.labelSet.dropDown.buttonSet.buttons[this.labelSet.dropDown.buttonSet.buttons.length - 1];
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_n', imageDepot.NITROGEN, 'Nitrogen', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'N';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_o', imageDepot.OXYGEN, 'Oxygen', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'O';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_f', imageDepot.FLUORINE, 'Fluorine', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'F';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_cl', imageDepot.CHLORINE, 'Chlorine', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'Cl';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_br', imageDepot.BROMINE, 'Bromine', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'Br';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_i', imageDepot.IODINE, 'Iodine', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'I';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_p', imageDepot.PHOSPHORUS, 'Phosphorus', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'P';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_s', imageDepot.SULFUR, 'Sulfur', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LABEL);
			self.sketcher.stateManager.STATE_LABEL.label = 'S';
		}));
		this.labelSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_label_pt', imageDepot.PERIODIC_TABLE, 'Choose Symbol', function() {
			for ( var i = 0, ii = self.sketcher.dialogManager.periodicTableDialog.canvas.cells.length; i < ii; i++) {
				var cell = self.sketcher.dialogManager.periodicTableDialog.canvas.cells[i];
				if (cell.element.symbol === self.sketcher.stateManager.STATE_LABEL.label) {
					self.sketcher.dialogManager.periodicTableDialog.canvas.selected = cell;
					self.sketcher.dialogManager.periodicTableDialog.canvas.repaint();
					break;
				}
			}
			self.sketcher.dialogManager.periodicTableDialog.getElement().dialog('open');
		}));
	};
	_.makeBondSet = function(self) {
		this.bondSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_bond');
		this.buttonSingle = new desktop.Button(self.sketcher.id + '_button_bond_single', imageDepot.BOND_SINGLE, 'Single Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 1;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		});
		this.bondSet.buttons.push(this.buttonSingle);
		this.buttonRecessed = new desktop.Button(self.sketcher.id + '_button_bond_recessed', imageDepot.BOND_RECESSED, 'Recessed Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 1;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_RECESSED;
		});
		this.bondSet.buttons.push(this.buttonRecessed);
		this.buttonProtruding = new desktop.Button(self.sketcher.id + '_button_bond_protruding', imageDepot.BOND_PROTRUDING, 'Protruding Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 1;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_PROTRUDING;
		});
		this.bondSet.buttons.push(this.buttonProtruding);
		this.buttonDouble = new desktop.Button(self.sketcher.id + '_button_bond_double', imageDepot.BOND_DOUBLE, 'Double Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 2;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		});
		this.bondSet.buttons.push(this.buttonDouble);
		this.buttonBond = new desktop.DummyButton(self.sketcher.id + '_button_bond', imageDepot.BOND_TRIPLE, 'Other Bond');
		this.bondSet.buttons.push(this.buttonBond);
		this.bondSet.addDropDown('More Bonds');
		this.bondSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_bond_zero', imageDepot.BOND_ZERO, 'Zero Bond (Ionic/Hydrogen)', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 0;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		}));
		this.bondSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_bond_half', imageDepot.BOND_HALF, 'Half Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 0.5;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		}));
		this.bondSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_bond_resonance', imageDepot.BOND_RESONANCE, 'Resonance Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 1.5;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		}));
		this.bondSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_bond_ambiguous_double', imageDepot.BOND_DOUBLE_AMBIGUOUS, 'Ambiguous Double Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 2;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_AMBIGUOUS;
		}));
		this.bondSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_bond_triple', imageDepot.BOND_TRIPLE, 'Triple Bond', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_BOND);
			self.sketcher.stateManager.STATE_NEW_BOND.bondOrder = 3;
			self.sketcher.stateManager.STATE_NEW_BOND.stereo = structures.Bond.STEREO_NONE;
		}));
		this.bondSet.dropDown.defaultButton = this.bondSet.dropDown.buttonSet.buttons[this.bondSet.dropDown.buttonSet.buttons.length - 1];
	};
	_.makeRingSet = function(self) {
		this.ringSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_ring');
		this.buttonCyclohexane = new desktop.Button(self.sketcher.id + '_button_ring_cyclohexane', imageDepot.CYCLOHEXANE, 'Cyclohexane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 6;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		});
		this.ringSet.buttons.push(this.buttonCyclohexane);
		this.buttonBenzene = new desktop.Button(self.sketcher.id + '_button_ring_benzene', imageDepot.BENZENE, 'Benzene Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 6;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = true;
		});
		this.ringSet.buttons.push(this.buttonBenzene);
		this.buttonRing = new desktop.DummyButton(self.sketcher.id + '_button_ring', imageDepot.CYCLOPENTANE, 'Other Ring');
		this.ringSet.buttons.push(this.buttonRing);
		this.ringSet.addDropDown('More Rings');
		this.ringSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_ring_cyclopropane', imageDepot.CYCLOPROPANE, 'Cyclopropane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 3;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		}));
		this.ringSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_ring_cyclobutane', imageDepot.CYCLOBUTANE, 'Cyclobutane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 4;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		}));
		this.ringSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_ring_cyclopentane', imageDepot.CYCLOPENTANE, 'Cyclopentane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 5;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		}));
		this.ringSet.dropDown.defaultButton = this.ringSet.dropDown.buttonSet.buttons[this.ringSet.dropDown.buttonSet.buttons.length - 1];
		this.ringSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_ring_cycloheptane', imageDepot.CYCLOHEPTANE, 'Cycloheptane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 7;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		}));
		this.ringSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_ring_cyclooctane', imageDepot.CYCLOOCTANE, 'Cyclooctane Ring', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_NEW_RING);
			self.sketcher.stateManager.STATE_NEW_RING.numSides = 8;
			self.sketcher.stateManager.STATE_NEW_RING.unsaturated = false;
		}));
	};
	_.makeAttributeSet = function(self) {
		this.attributeSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_attribute');
		this.buttonAttribute = new desktop.DummyButton(self.sketcher.id + '_button_attribute', imageDepot.INCREASE_CHARGE, 'Attributes');
		this.attributeSet.buttons.push(this.buttonAttribute);
		this.attributeSet.addDropDown('More Attributes');
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_charge_increment', imageDepot.INCREASE_CHARGE, 'Increase Charge', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_CHARGE);
			self.sketcher.stateManager.STATE_CHARGE.delta = 1;
		}));
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_charge_decrement', imageDepot.DECREASE_CHARGE, 'Decrease Charge', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_CHARGE);
			self.sketcher.stateManager.STATE_CHARGE.delta = -1;
		}));
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_lonePair_increment', imageDepot.ADD_LONE_PAIR, 'Add Lone Pair', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LONE_PAIR);
			self.sketcher.stateManager.STATE_LONE_PAIR.delta = 1;
		}));
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_lonePair_decrement', imageDepot.REMOVE_LONE_PAIR, 'Remove Lone Pair', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_LONE_PAIR);
			self.sketcher.stateManager.STATE_LONE_PAIR.delta = -1;
		}));
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_radical_increment', imageDepot.ADD_RADICAL, 'Add Radical', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_RADICAL);
			self.sketcher.stateManager.STATE_RADICAL.delta = 1;
		}));
		this.attributeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_attribute_radical_decrement', imageDepot.REMOVE_RADICAL, 'Remove Radical', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_RADICAL);
			self.sketcher.stateManager.STATE_RADICAL.delta = -1;
		}));
	};
	_.makeShapeSet = function(self) {
		this.shapeSet = new desktop.ButtonSet(self.sketcher.id + '_buttons_shape');
		this.buttonShape = new desktop.DummyButton(self.sketcher.id + '_button_shape', imageDepot.ARROW_SYNTHETIC, 'Add Shape');
		this.shapeSet.buttons.push(this.buttonShape);
		this.shapeSet.addDropDown('More Shapes');
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_arrow_synthetic', imageDepot.ARROW_SYNTHETIC, 'Synthetic Arrow', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_SHAPE);
			self.sketcher.stateManager.STATE_SHAPE.shapeType = states.ShapeState.ARROW_SYNTHETIC;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_arrow_retrosynthetic', imageDepot.ARROW_RETROSYNTHETIC, 'Retrosynthetic Arrow', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_SHAPE);
			self.sketcher.stateManager.STATE_SHAPE.shapeType = states.ShapeState.ARROW_RETROSYNTHETIC;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_arrow_resonance', imageDepot.ARROW_RESONANCE, 'Resonance Arrow', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_SHAPE);
			self.sketcher.stateManager.STATE_SHAPE.shapeType = states.ShapeState.ARROW_RESONANCE;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_arrow_equilibrium', imageDepot.ARROW_EQUILIBRIUM, 'Equilibrium Arrow', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_SHAPE);
			self.sketcher.stateManager.STATE_SHAPE.shapeType = states.ShapeState.ARROW_EQUILIBRIUM;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_pusher_1', imageDepot.PUSHER_SINGLE, 'Single Electron Pusher', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_PUSHER);
			self.sketcher.stateManager.STATE_PUSHER.numElectron = 1;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_pusher_2', imageDepot.PUSHER_DOUBLE, 'Electron Pair Pusher', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_PUSHER);
			self.sketcher.stateManager.STATE_PUSHER.numElectron = 2;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_pusher_bond_forming', imageDepot.PUSHER_BOND_FORMING, 'Bond Forming Pusher', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_PUSHER);
			self.sketcher.stateManager.STATE_PUSHER.numElectron = -1;
		}));
		this.shapeSet.dropDown.buttonSet.buttons.push(new desktop.Button(self.sketcher.id + '_button_shape_charge_bracket', imageDepot.CHARGE_BRACKET, 'Bracket', function() {
			self.sketcher.stateManager.setState(self.sketcher.stateManager.STATE_SHAPE);
			self.sketcher.stateManager.STATE_SHAPE.shapeType = states.ShapeState.BRACKET;
			self.sketcher.repaint();
		}));
	};

})(ChemDoodle, ChemDoodle.iChemLabs, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.uis.actions, ChemDoodle.uis.gui, ChemDoodle.uis.gui.imageDepot, ChemDoodle.uis.gui.desktop, ChemDoodle.uis.tools, ChemDoodle.uis.states, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(math, monitor, tools) {
	'use strict';
	tools.Lasso = function(sketcher) {
		this.sketcher = sketcher;
		this.atoms = [];
		this.shapes = [];
		this.bounds = undefined;
		this.mode = tools.Lasso.MODE_LASSO;
		this.points = [];
	};
	tools.Lasso.MODE_LASSO = 'lasso';
	tools.Lasso.MODE_LASSO_SHAPES = 'shapes';
	tools.Lasso.MODE_RECTANGLE_MARQUEE = 'rectangle';
	var _ = tools.Lasso.prototype;
	_.select = function(atoms, shapes) {
		if (this.block) {
			return;
		}
		if (!monitor.SHIFT) {
			this.empty();
		}
		if (atoms) {
			this.atoms = atoms.slice(0);
			this.shapes = shapes.slice(0);
		} else {
			if (this.mode !== tools.Lasso.MODE_LASSO_SHAPES) {
				var asAdd = [];
				for ( var i = 0, ii = this.sketcher.molecules.length; i < ii; i++) {
					var mol = this.sketcher.molecules[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (this.mode === tools.Lasso.MODE_RECTANGLE_MARQUEE) {
							if (this.points.length === 2) {
								if (math.isBetween(a.x, this.points[0].x, this.points[1].x) && math.isBetween(a.y, this.points[0].y, this.points[1].y)) {
									asAdd.push(a);
								}
							}
						} else {
							if (this.points.length > 1) {
								if (math.isPointInPoly(this.points, a)) {
									asAdd.push(a);
								}
							}
						}
					}
				}
				if (this.atoms.length === 0) {
					this.atoms = asAdd;
				} else {
					var asFinal = [];
					for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
						var a = this.atoms[i];
						if (asAdd.indexOf(a) === -1) {
							asFinal.push(a);
						} else {
							a.isLassoed = false;
						}
					}
					for ( var i = 0, ii = asAdd.length; i < ii; i++) {
						if (this.atoms.indexOf(asAdd[i]) === -1) {
							asFinal.push(asAdd[i]);
						}
					}
					this.atoms = asFinal;
				}
			}
			var ssAdd = [];
			for ( var i = 0, ii = this.sketcher.shapes.length; i < ii; i++) {
				var s = this.sketcher.shapes[i];
				var sps = s.getPoints();
				var contained = sps.length>0;
				for ( var j = 0, jj = sps.length; j < jj; j++) {
					var p = sps[j];
					if (this.mode === tools.Lasso.MODE_RECTANGLE_MARQUEE) {
						if (this.points.length === 2) {
							if (!math.isBetween(p.x, this.points[0].x, this.points[1].x) || !math.isBetween(p.y, this.points[0].y, this.points[1].y)) {
								contained = false;
								break;
							}
						} else {
							contained = false;
							break;
						}
					} else {
						if (this.points.length > 1) {
							if (!math.isPointInPoly(this.points, p)) {
								contained = false;
								break;
							}
						} else {
							contained = false;
							break;
						}
					}
				}
				if (contained) {
					ssAdd.push(s);
				}
			}
			if (this.shapes.length === 0) {
				this.shapes = ssAdd;
			} else {
				var ssFinal = [];
				for ( var i = 0, ii = this.shapes.length; i < ii; i++) {
					var s = this.shapes[i];
					if (ssAdd.indexOf(s) === -1) {
						asFinal.push(s);
					} else {
						s.isLassoed = false;
					}
				}
				for ( var i = 0, ii = ssAdd.length; i < ii; i++) {
					if (this.shapes.indexOf(ssAdd[i]) === -1) {
						ssFinal.push(ssAdd[i]);
					}
				}
				this.shapes = ssFinal;
			}
		}
		for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
			this.atoms[i].isLassoed = true;
		}
		for ( var i = 0, ii = this.shapes.length; i < ii; i++) {
			this.shapes[i].isLassoed = true;
		}
		this.setBounds();
		if (this.bounds && this.bounds.minX === Infinity) {
			this.empty();
		}
		this.points = [];
		this.sketcher.stateManager.getCurrentState().clearHover();
		this.enableButtons();
		this.sketcher.repaint();
	};
	_.enableButtons = function() {
		if (this.sketcher.useServices) {
			if (this.atoms.length > 0) {
				this.sketcher.toolbarManager.buttonClean.enable();
				this.sketcher.toolbarManager.buttonCalculate.enable();
				this.sketcher.toolbarManager.buttonSave.enable();
			} else {
				this.sketcher.toolbarManager.buttonClean.disable();
				this.sketcher.toolbarManager.buttonCalculate.disable();
				this.sketcher.toolbarManager.buttonSave.disable();
			}
		}
	};
	_.setBounds = function() {
		if (this.isActive()) {
			this.sketcher.repaint();
			this.bounds = new math.Bounds();
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				var a = this.atoms[i];
				this.bounds.expand(a.getBounds());
			}
			for ( var i = 0, ii = this.shapes.length; i < ii; i++) {
				this.bounds.expand(this.shapes[i].getBounds());
			}
			var buffer = 5;
			this.bounds.minX -= buffer;
			this.bounds.minY -= buffer;
			this.bounds.maxX += buffer;
			this.bounds.maxY += buffer;
		} else {
			this.bounds = undefined;
		}
	};
	_.empty = function() {
		for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
			this.atoms[i].isLassoed = false;
		}
		for ( var i = 0, ii = this.shapes.length; i < ii; i++) {
			this.shapes[i].isLassoed = false;
		}
		this.atoms = [];
		this.shapes = [];
		this.bounds = undefined;
		this.enableButtons();
		this.sketcher.repaint();
	};
	_.draw = function(ctx, specs) {
		ctx.strokeStyle = 'blue';
		ctx.lineWidth = 0.5 / specs.scale;
		/*
		 * if(ctx.setLineDash){ // new feature in HTML5, not yet supported
		 * everywhere, so don't use as it is unstable ctx.setLineDash([5]); }
		 */
		if (this.points.length > 0) {
			if (this.mode === tools.Lasso.MODE_RECTANGLE_MARQUEE) {
				if (this.points.length === 2) {
					var p1 = this.points[0];
					var p2 = this.points[1];
					ctx.beginPath();
					ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
					ctx.stroke();
				}
			} else {
				if (this.points.length > 1) {
					ctx.beginPath();
					ctx.moveTo(this.points[0].x, this.points[0].y);
					for ( var i = 1, ii = this.points.length; i < ii; i++) {
						ctx.lineTo(this.points[i].x, this.points[i].y);
					}
					ctx.closePath();
					ctx.stroke();
				}
			}
		}
		if (this.bounds) {
			ctx.beginPath();
			ctx.rect(this.bounds.minX, this.bounds.minY, this.bounds.maxX - this.bounds.minX, this.bounds.maxY - this.bounds.minY);
			ctx.stroke();
		}
	};
	_.isActive = function() {
		return this.atoms.length > 0 || this.shapes.length > 0;
	};
	_.getFirstMolecule = function() {
		if (this.atoms.length > 0) {
			return this.sketcher.getMoleculeByAtom(this.atoms[0]);
		}
		return undefined;
	};
	_.getAllPoints = function() {
		var ps = this.atoms;
		for ( var i = 0, ii = this.shapes.length; i < ii; i++) {
			ps = ps.concat(this.shapes[i].getPoints());
		}
		return ps;
	};
	_.addPoint = function(p) {
		if (this.mode === tools.Lasso.MODE_RECTANGLE_MARQUEE) {
			if (this.points.length < 2) {
				this.points.push(p);
			} else {
				var changing = this.points[1];
				changing.x = p.x;
				changing.y = p.y;
			}
		} else {
			this.points.push(p);
		}
	};

})(ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.uis.tools);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, extensions, featureDetection, sketcherPack, structures, tools, q, m, window) {
	'use strict';
	c.SketcherCanvas = function(id, width, height, options) {
		// keep checks to undefined here as these are booleans
		this.isMobile = options.isMobile;
		this.useServices = options.useServices === undefined ? false : options.useServices;
		this.oneMolecule = options.oneMolecule === undefined ? false : options.oneMolecule;
		this.includeToolbar = options.includeToolbar === undefined ? true : options.includeToolbar;
		this.includeQuery = options.includeQuery === undefined ? false : options.includeQuery;
		// toolbar manager needs the sketcher id to make it unique to this
		// canvas
		this.id = id;
		this.toolbarManager = new sketcherPack.gui.ToolbarManager(this);
		if (this.includeToolbar) {
			this.toolbarManager.write();
			// If pre-created, wait until the last button image loads before
			// calling setup.
			var self = this;
			if (document.getElementById(this.id)) {
				q('#' + id + '_button_attribute_lonePair_decrement_icon').load(function() {
					self.toolbarManager.setup();
				});
			} else {
				q(window).load(function() {
					self.toolbarManager.setup();
				});
			}
			this.dialogManager = new sketcherPack.gui.DialogManager(this);
		}
		this.stateManager = new sketcherPack.states.StateManager(this);
		this.historyManager = new sketcherPack.actions.HistoryManager(this);
		if (id) {
			this.create(id, width, height);
		}
		this.specs.atoms_circleDiameter_2D = 7;
		this.specs.atoms_circleBorderWidth_2D = 0;
		this.isHelp = false;
		this.lastPinchScale = 1;
		this.lastGestureRotate = 0;
		this.inGesture = false;
		if (this.oneMolecule) {
			var startMol = new structures.Molecule();
			startMol.atoms.push(new structures.Atom());
			this.loadMolecule(startMol);
		} else {
			this.startAtom = new structures.Atom('C', -10, -10);
			this.startAtom.isLone = true;
			this.lasso = new tools.Lasso(this);
		}
	};
	var _ = c.SketcherCanvas.prototype = new c._Canvas();
	_.drawSketcherDecorations = function(ctx) {
		ctx.save();
		ctx.translate(this.width / 2, this.height / 2);
		ctx.rotate(this.specs.rotateAngle);
		ctx.scale(this.specs.scale, this.specs.scale);
		ctx.translate(-this.width / 2, -this.height / 2);
		if (this.hovering) {
			this.hovering.drawDecorations(ctx, this.specs);
		}
		if (this.startAtom && this.startAtom.x != -10 && !this.isMobile) {
			this.startAtom.draw(ctx, this.specs);
		}
		if (this.tempAtom) {
			ctx.strokeStyle = '#00FF00';
			ctx.fillStyle = '#00FF00';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this.hovering.x, this.hovering.y);
			extensions.contextHashTo(ctx, this.hovering.x, this.hovering.y, this.tempAtom.x, this.tempAtom.y, 2, 2);
			ctx.stroke();
			if (this.tempAtom.label === 'C') {
				ctx.beginPath();
				ctx.arc(this.tempAtom.x, this.tempAtom.y, 3, 0, m.PI * 2, false);
				ctx.fill();
			}else{
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.font = extensions.getFontString(this.specs.atoms_font_size_2D, this.specs.atoms_font_families_2D, this.specs.atoms_font_bold_2D, this.specs.atoms_font_italic_2D);
				ctx.fillText(this.tempAtom.label, this.tempAtom.x, this.tempAtom.y);
			}
			if (this.tempAtom.isOverlap) {
				ctx.strokeStyle = '#C10000';
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				ctx.arc(this.tempAtom.x, this.tempAtom.y, 7, 0, m.PI * 2, false);
				ctx.stroke();
			}
		}
		if (this.tempRing) {
			ctx.strokeStyle = '#00FF00';
			ctx.fillStyle = '#00FF00';
			ctx.lineWidth = 1;
			ctx.beginPath();
			if (this.hovering instanceof structures.Atom) {
				ctx.moveTo(this.hovering.x, this.hovering.y);
				extensions.contextHashTo(ctx, this.hovering.x, this.hovering.y, this.tempRing[0].x, this.tempRing[0].y, 2, 2);
				for ( var i = 1, ii = this.tempRing.length; i < ii; i++) {
					extensions.contextHashTo(ctx, this.tempRing[i - 1].x, this.tempRing[i - 1].y, this.tempRing[i].x, this.tempRing[i].y, 2, 2);
				}
				extensions.contextHashTo(ctx, this.tempRing[this.tempRing.length - 1].x, this.tempRing[this.tempRing.length - 1].y, this.hovering.x, this.hovering.y, 2, 2);
			} else if (this.hovering instanceof structures.Bond) {
				var start = this.hovering.a2;
				var end = this.hovering.a1;
				if (this.tempRing[0] === this.hovering.a1) {
					start = this.hovering.a1;
					end = this.hovering.a2;
				}
				ctx.moveTo(start.x, start.y);
				extensions.contextHashTo(ctx, start.x, start.y, this.tempRing[1].x, this.tempRing[1].y, 2, 2);
				for ( var i = 2, ii = this.tempRing.length; i < ii; i++) {
					extensions.contextHashTo(ctx, this.tempRing[i - 1].x, this.tempRing[i - 1].y, this.tempRing[i].x, this.tempRing[i].y, 2, 2);
				}
				extensions.contextHashTo(ctx, this.tempRing[this.tempRing.length - 1].x, this.tempRing[this.tempRing.length - 1].y, end.x, end.y, 2, 2);
			}
			ctx.stroke();
			ctx.strokeStyle = '#C10000';
			ctx.lineWidth = 1.2;
			for ( var i = 0, ii = this.tempRing.length; i < ii; i++) {
				if (this.tempRing[i].isOverlap) {
					ctx.beginPath();
					ctx.arc(this.tempRing[i].x, this.tempRing[i].y, 7, 0, m.PI * 2, false);
					ctx.stroke();
				}
			}
		}
		if (this.lasso) {
			this.lasso.draw(ctx, this.specs);
		}
		if (this.stateManager.getCurrentState().draw) {
			this.stateManager.getCurrentState().draw(ctx);
		}
		ctx.restore();
	};
	_.drawChildExtras = function(ctx) {
		this.drawSketcherDecorations(ctx);
		if (!this.hideHelp) {
			// help and tutorial
			var helpPos = new structures.Point(this.width - 20, 20);
			var radgrad = ctx.createRadialGradient(helpPos.x, helpPos.y, 10, helpPos.x, helpPos.y, 2);
			radgrad.addColorStop(0, '#00680F');
			radgrad.addColorStop(1, '#FFFFFF');
			ctx.fillStyle = radgrad;
			ctx.beginPath();
			ctx.arc(helpPos.x, helpPos.y, 10, 0, m.PI * 2, false);
			ctx.fill();
			if (this.isHelp) {
				ctx.lineWidth = 2;
				ctx.strokeStyle = 'black';
				ctx.stroke();
			}
			ctx.fillStyle = this.isHelp ? 'red' : 'black';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '14px sans-serif';
			ctx.fillText('?', helpPos.x, helpPos.y);
		}
		if (!this.paidToHideTrademark) {
			// You must keep this name displayed at all times to abide by the license
			// Contact us for permission to remove it,
			// http://www.ichemlabs.com/contact-us
			ctx.font = '14px sans-serif';
			var x = '\x43\x68\x65\x6D\x44\x6F\x6F\x64\x6C\x65';
			var width = ctx.measureText(x).width;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			ctx.fillStyle = 'rgba(0, 60, 0, 0.5)';
			ctx.fillText(x, this.width - width - 13, this.height - 4);
			ctx.font = '8px sans-serif';
			ctx.fillText('\u00AE', this.width - 13, this.height - 12);
		}
	};
	_.scaleEvent = function(e) {
		e.op = new structures.Point(e.p.x, e.p.y);
		if (this.specs.scale !== 1) {
			e.p.x = this.width / 2 + (e.p.x - this.width / 2) / this.specs.scale;
			e.p.y = this.height / 2 + (e.p.y - this.height / 2) / this.specs.scale;
		}
	};
	_.checkScale = function() {
		if (this.specs.scale < .5) {
			this.specs.scale = .5;
		} else if (this.specs.scale > 10) {
			this.specs.scale = 10;
		}
	};
	// desktop events
	_.click = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().click(e);
	};
	_.rightclick = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().rightclick(e);
	};
	_.dblclick = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().dblclick(e);
	};
	_.mousedown = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mousedown(e);
	};
	_.rightmousedown = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().rightmousedown(e);
	};
	_.mousemove = function(e) {
		// link to tutorial
		this.isHelp = false;
		if (e.p.distance(new structures.Point(this.width - 20, 20)) < 10) {
			this.isHelp = true;
		}
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mousemove(e);
		// repaint is called in the state mousemove event
	};
	_.mouseout = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mouseout(e);
	};
	_.mouseover = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mouseover(e);
	};
	_.mouseup = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mouseup(e);
	};
	_.rightmouseup = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().rightmouseup(e);
	};
	_.mousewheel = function(e, delta) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mousewheel(e, delta);
	};
	_.drag = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().drag(e);
	};
	_.keydown = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().keydown(e);
	};
	_.keypress = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().keypress(e);
	};
	_.keyup = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().keyup(e);
	};
	_.touchstart = function(e) {
		if (e.originalEvent.touches && e.originalEvent.touches.length > 1) {
			if (this.tempAtom || this.tempRing) {
				this.tempAtom = undefined;
				this.tempRing = undefined;
				this.hovering = undefined;
				this.repaint();
			}
			this.lastPoint = undefined;
		} else {
			this.scaleEvent(e);
			this.stateManager.getCurrentState().mousemove(e);
			this.stateManager.getCurrentState().mousedown(e);
		}
	};
	_.touchmove = function(e) {
		this.scaleEvent(e);
		if (!this.inGesture) {
			this.stateManager.getCurrentState().drag(e);
		}
	};
	_.touchend = function(e) {
		this.scaleEvent(e);
		this.stateManager.getCurrentState().mouseup(e);
		if (this.hovering) {
			this.stateManager.getCurrentState().clearHover();
			this.repaint();
		}
	};
	_.gesturechange = function(e) {
		this.inGesture = true;
		if (e.originalEvent.scale - this.lastPinchScale !== 1) {
			if (!(this.lasso && this.lasso.isActive())) {
				this.specs.scale *= e.originalEvent.scale / this.lastPinchScale;
				this.checkScale();
			}
			this.lastPinchScale = e.originalEvent.scale;
		}
		if (this.lastGestureRotate - e.originalEvent.rotation !== 0) {
			var rot = (this.lastGestureRotate - e.originalEvent.rotation) / 180 * m.PI;
			if (!this.parentAction) {
				var ps = (this.lasso && this.lasso.isActive()) ? this.lasso.getAllPoints() : this.getAllPoints();
				var center = (this.lasso && this.lasso.isActive()) ? new structures.Point((this.lasso.bounds.minX + this.lasso.bounds.maxX) / 2, (this.lasso.bounds.minY + this.lasso.bounds.maxY) / 2) : new structures.Point(this.width / 2, this.height / 2);
				this.parentAction = new sketcherPack.actions.RotateAction(ps, rot, center);
				this.historyManager.pushUndo(this.parentAction);
			} else {
				this.parentAction.dif += rot;
				for ( var i = 0, ii = this.parentAction.ps.length; i < ii; i++) {
					var p = this.parentAction.ps[i];
					var dist = this.parentAction.center.distance(p);
					var angle = this.parentAction.center.angle(p) + rot;
					p.x = this.parentAction.center.x + dist * m.cos(angle);
					p.y = this.parentAction.center.y - dist * m.sin(angle);
				}
				// must check here as change is outside of an action
				for ( var i = 0, ii = this.molecules.length; i < ii; i++) {
					this.molecules[i].check();
				}
				if (this.lasso && this.lasso.isActive()) {
					this.lasso.setBounds();
				}
			}
			this.lastGestureRotate = e.originalEvent.rotation;
		}
		this.repaint();
	};
	_.gestureend = function(e) {
		this.inGesture = false;
		this.lastPinchScale = 1;
		this.lastGestureRotate = 0;
		this.parentAction = undefined;
	};

})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.featureDetection, ChemDoodle.uis, ChemDoodle.structures, ChemDoodle.uis.tools, ChemDoodle.lib.jQuery, Math, window);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, math, monitor, actions, states, structures, SYMBOLS, m, m4) {
	'use strict';
	states._State3D = function() {
	};
	var _ = states._State3D.prototype;
	_.setup = function(editor) {
		this.editor = editor;
	};

	_.enter = function() {
		if (this.innerenter) {
			this.innerenter();
		}
	};
	_.exit = function() {
		if (this.innerexit) {
			this.innerexit();
		}
	};
	_.click = function(e) {
		if (this.innerclick) {
			this.innerclick(e);
		}
	};
	_.rightclick = function(e) {
		if (this.innerrightclick) {
			this.innerrightclick(e);
		}
	};
	_.dblclick = function(e) {
		if (this.innerdblclick) {
			this.innerdblclick(e);
		}
	};
	_.mousedown = function(e) {
		this.editor.defaultmousedown(e);
		// must also check for mobile hits here to the help button
		if (this.editor.isHelp || this.editor.isMobile && e.p.distance(new structures.Point(this.editor.width - 20, 20)) < 10) {
			this.editor.isHelp = false;
			this.editor.lastPoint = undefined;
			this.editor.repaint();
			window.open('http://web.chemdoodle.com/demos/3d-editor');
		} else if (this.innermousedown) {
			this.innermousedown(e);
		}
	};
	_.rightmousedown = function(e) {
		if (this.innerrightmousedown) {
			this.innerrightmousedown(e);
		}
		this.editor.defaultrightmousedown(e);
	};
	_.mousemove = function(e) {
		if (this.innermousemove) {
			this.innermousemove(e);
		}
		// call the repaint here to repaint the help button, also this is called
		// by other functions, so the repaint must be here
		this.editor.repaint();
	};
	_.mouseout = function(e) {
		if (this.innermouseout) {
			this.innermouseout(e);
		}
	};
	_.mouseover = function(e) {
		if (this.innermouseover) {
			this.innermouseover(e);
		}
	};
	_.mouseup = function(e) {
		if (this.innermouseup) {
			this.innermouseup(e);
		}
		this.editor.defaultmouseup(e);
	};
	_.rightmouseup = function(e) {
		if (this.innerrightmouseup) {
			this.innerrightmouseup(e);
		}
	};
	_.mousewheel = function(e, delta) {
		if (this.innermousewheel) {
			this.innermousewheel(e);
		} else {
			this.editor.defaultmousewheel(e, delta);
		}
	};
	_.drag = function(e) {
		if (this.innerdrag) {
			this.innerdrag(e);
		} else {
			this.editor.defaultdrag(e);
		}
	};
	_.keydown = function(e) {
		if (monitor.META) {
			if (e.which === 90) {
				// z
				this.editor.historyManager.undo();
			} else if (e.which === 89) {
				// y
				this.editor.historyManager.redo();
			} else if (e.which === 83) {
				// s
				this.editor.toolbarManager.buttonSave.getElement().click();
			} else if (e.which === 79) {
				// o
				this.editor.toolbarManager.buttonOpen.getElement().click();
			} else if (e.which === 78) {
				// n
				this.editor.toolbarManager.buttonClear.getElement().click();
			} else if (e.which === 187 || e.which === 61) {
				// +
				this.editor.toolbarManager.buttonScalePlus.getElement().click();
			} else if (e.which === 189 || e.which === 109) {
				// -
				this.editor.toolbarManager.buttonScaleMinus.getElement().click();
			}
		}
		if (this.innerkeydown) {
			this.innerkeydown(e);
		}
	};
	_.keypress = function(e) {
		if (this.innerkeypress) {
			this.innerkeypress(e);
		}
	};
	_.keyup = function(e) {
		if (this.innerkeyup) {
			this.innerkeyup(e);
		}
	};

})(ChemDoodle, ChemDoodle.math, ChemDoodle.monitor, ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, ChemDoodle.SYMBOLS, Math, ChemDoodle.lib.mat4);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(actions, states, structures, d3, q) {
	'use strict';
	states.MeasureState3D = function(editor) {
		this.setup(editor);
		this.selectedAtoms = [];
	};
	var _ = states.MeasureState3D.prototype = new states._State3D();
	_.numToSelect = 2;

	_.reset = function(){
		for(var i = 0, ii = this.selectedAtoms.length; i<ii; i++){
			this.selectedAtoms[i].isSelected = false;
		}
		this.selectedAtoms = [];
		this.editor.repaint();
	};
	_.innerenter = function(e) {
		this.reset();
	};
	_.innerexit = function(e) {
		this.reset();
	};
	_.innermousemove = function(e) {
		if (this.hoveredAtom) {
			this.hoveredAtom.isHover = false;
			this.hoveredAtom = undefined;
		}
		var obj = this.editor.pick(e.p.x, e.p.y, true, false);
		if (obj && obj instanceof structures.Atom) {
			this.hoveredAtom = obj;
			obj.isHover = true;
		}
		this.editor.repaint();
	};
	_.innermousedown = function(e) {
		// don't use click as that doesn't work on android
		if(this.editor.isMobile){
			this.innermousemove(e);
		}
		if (this.hoveredAtom) {
			this.hoveredAtom.isHover = false;
			if (this.hoveredAtom.isSelected) {
				var a = this.hoveredAtom;
				this.selectedAtoms = q.grep(this.selectedAtoms, function(value) {
					return value !== a;
				});
			} else {
				this.selectedAtoms.push(this.hoveredAtom);
			}
			this.hoveredAtom.isSelected = !this.hoveredAtom.isSelected;
			this.hoveredAtom = undefined;
			this.editor.repaint();
		}
		if (this.selectedAtoms.length === this.numToSelect) {
			var shape;
			switch(this.numToSelect){
			case 2:
				shape = new d3.Distance(this.selectedAtoms[0], this.selectedAtoms[1]);
				break;
			case 3:
				shape = new d3.Angle(this.selectedAtoms[0], this.selectedAtoms[1], this.selectedAtoms[2]);
				break;
			case 4:
				shape = new d3.Torsion(this.selectedAtoms[0], this.selectedAtoms[1], this.selectedAtoms[2], this.selectedAtoms[3]);
				break;
			}
			this.reset();
			if(shape){
				this.editor.historyManager.pushUndo(new actions.AddShapeAction(this.editor, shape));
			}
		}
	};

})(ChemDoodle.uis.actions, ChemDoodle.uis.states, ChemDoodle.structures, ChemDoodle.structures.d3, ChemDoodle.lib.jQuery);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(states) {
	'use strict';
	states.ViewState3D = function(editor) {
		this.setup(editor);
	};
	var _ = states.ViewState3D.prototype = new states._State3D();

})(ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(states) {
	'use strict';
	states.StateManager3D = function(editor) {
		this.STATE_VIEW = new states.ViewState3D(editor);
		this.STATE_MEASURE = new states.MeasureState3D(editor);
		var currentState = this.STATE_VIEW;
		this.setState = function(nextState) {
			if (nextState !== currentState) {
				currentState.exit();
				currentState = nextState;
				currentState.enter();
			}
		};
		this.getCurrentState = function() {
			return currentState;
		};
	};

})(ChemDoodle.uis.states);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
(function(c, iChemLabs, io, structures, actions, gui, imageDepot, desktop, tools, states, q, document) {
	'use strict';
	gui.ToolbarManager3D = function(editor) {
		this.editor = editor;

		// open
		this.buttonOpen = new desktop.Button(editor.id + '_button_open', imageDepot.OPEN, 'Open', function() {
			editor.dialogManager.loadDialog.getTextArea().val('');
			editor.dialogManager.loadDialog.getElement().dialog('open');
		});
		// save
		this.buttonSave = new desktop.Button(editor.id + '_button_save', imageDepot.SAVE, 'Save', function() {
			if (editor.useServices) {
				editor.dialogManager.saveDialog.clear();
			} else {
				editor.dialogManager.saveDialog.getTextArea().val(c.writeMOL(editor.molecules[0]));
			}
			editor.dialogManager.saveDialog.getElement().dialog('open');
		});
		// search
		this.buttonSearch = new desktop.Button(editor.id + '_button_search', imageDepot.SEARCH, 'Search', function() {
			editor.dialogManager.searchDialog.getElement().dialog('open');
		});
		// calculate
		this.buttonCalculate = new desktop.Button(editor.id + '_button_calculate', imageDepot.CALCULATE, 'Calculate', function() {
			var mol = editor.molecules[0];
			if (mol) {
				iChemLabs.calculate(mol, {
					descriptors : [ 'mf', 'ef', 'mw', 'miw', 'deg_unsat', 'hba', 'hbd', 'rot', 'electron', 'pol_miller', 'cmr', 'tpsa', 'vabc', 'xlogp2', 'bertz' ]
				}, function(content) {
					var sb = [];
					function addDatum(title, value, unit) {
						sb.push(title);
						sb.push(': ');
						for ( var i = title.length + 2; i < 30; i++) {
							sb.push(' ');
						}
						sb.push(value);
						sb.push(' ');
						sb.push(unit);
						sb.push('\n');
					}
					addDatum('Molecular Formula', content.mf, '');
					addDatum('Empirical Formula', content.ef, '');
					addDatum('Molecular Mass', content.mw, 'amu');
					addDatum('Monoisotopic Mass', content.miw, 'amu');
					addDatum('Degree of Unsaturation', content.deg_unsat, '');
					addDatum('Hydrogen Bond Acceptors', content.hba, '');
					addDatum('Hydrogen Bond Donors', content.hbd, '');
					addDatum('Rotatable Bonds', content.rot, '');
					addDatum('Total Electrons', content.rot, '');
					addDatum('Molecular Polarizability', content.pol_miller, 'A^3');
					addDatum('Molar Refractivity', content.cmr, 'cm^3/mol');
					addDatum('Polar Surface Area', content.tpsa, 'A^2');
					addDatum('vdW Volume', content.vabc, 'A^3');
					addDatum('logP', content.xlogp2, '');
					addDatum('Complexity', content.bertz, '');
					editor.dialogManager.calculateDialog.getTextArea().val(sb.join(''));
					editor.dialogManager.calculateDialog.getElement().dialog('open');
				});
			}
		});

		// transform
		this.buttonTransform = new desktop.Button(editor.id + '_button_transform', imageDepot.PERSPECTIVE, 'Transform', function() {
			editor.stateManager.setState(editor.stateManager.STATE_VIEW);
		});
		this.buttonTransform.toggle = true;

		// visual specifications
		this.buttonSettings = new desktop.Button(editor.id + '_button_specifications', imageDepot.SETTINGS, 'Visual Specifications', function() {
			editor.dialogManager.specsDialog.update(editor.specs);
			editor.dialogManager.specsDialog.getElement().dialog('open');
		});

		// animations
		this.buttonAnimation = new desktop.Button(editor.id + '_button_animation', imageDepot.ANIMATION, 'Animations', function() {
			editor.stateManager.setState(editor.stateManager.STATE_MOVE);
		});

		// clear
		this.buttonClear = new desktop.Button(editor.id + '_button_clear', imageDepot.CLEAR, 'Clear', function() {
			editor.historyManager.pushUndo(new actions.ClearAction(editor));
		});
		// clean
		this.buttonClean = new desktop.Button(editor.id + '_button_clean', imageDepot.OPTIMIZE, 'Clean', function() {
			var mol = editor.molecules[0];
			if (mol) {
				iChemLabs.optimize(mol, {
					dimension : 3
				}, function(mol) {
					editor.historyManager.pushUndo(new actions.SwitchMoleculeAction(editor, mol));
				});
			}
		});

		// scale set
		this.makeScaleSet(this);

		// history set
		this.makeHistorySet(this);

		// history set
		this.makeMeasurementsSet(this);
	};
	var _ = gui.ToolbarManager3D.prototype;
	_.write = function() {
		var sb = [ '<div style="font-size:10px;">' ];
		var bg = this.editor.id + '_main_group';
		sb.push(this.historySet.getSource());
		sb.push(this.scaleSet.getSource());
		sb.push(this.buttonOpen.getSource());
		sb.push(this.buttonSave.getSource());
		if (this.editor.useServices) {
			sb.push(this.buttonSearch.getSource());
			sb.push(this.buttonCalculate.getSource());
		}
		sb.push('<br>');
		sb.push(this.buttonTransform.getSource(bg));
		sb.push(this.buttonSettings.getSource());
		//sb.push(this.buttonAnimation.getSource());
		sb.push(this.measurementsSet.getSource(bg));
		sb.push(this.buttonClear.getSource());
		if (this.editor.useServices) {
			sb.push(this.buttonClean.getSource());
		}
		sb.push('</div>');

		if (document.getElementById(this.editor.id)) {
			var canvas = q('#' + this.editor.id);
			canvas.before(sb.join(''));
		} else {
			document.write(sb.join(''));
		}
	};
	_.setup = function() {
		this.buttonTransform.setup(true);
		this.buttonSettings.setup();
		//this.buttonAnimation.setup();
		this.measurementsSet.setup();
		this.buttonClear.setup();
		if (this.editor.useServices) {
			this.buttonClean.setup();
		}
		this.historySet.setup();
		this.scaleSet.setup();
		this.buttonOpen.setup();
		this.buttonSave.setup();
		if (this.editor.useServices) {
			this.buttonSearch.setup();
			this.buttonCalculate.setup();
		}

		this.buttonTransform.select();
		this.buttonUndo.disable();
		this.buttonRedo.disable();
	};

	_.makeScaleSet = function(self) {
		this.scaleSet = new desktop.ButtonSet(self.editor.id + '_buttons_scale');
		this.scaleSet.toggle = false;
		this.buttonScalePlus = new desktop.Button(self.editor.id + '_button_scale_plus', imageDepot.ZOOM_IN, 'Increase Scale', function() {
			self.editor.mousewheel(null, -10);
		});
		this.scaleSet.buttons.push(this.buttonScalePlus);
		this.buttonScaleMinus = new desktop.Button(self.editor.id + '_button_scale_minus', imageDepot.ZOOM_OUT, 'Decrease Scale', function() {
			self.editor.mousewheel(null, 10);
		});
		this.scaleSet.buttons.push(this.buttonScaleMinus);
	};
	_.makeHistorySet = function(self) {
		this.historySet = new desktop.ButtonSet(self.editor.id + '_buttons_history');
		this.historySet.toggle = false;
		this.buttonUndo = new desktop.Button(self.editor.id + '_button_undo', imageDepot.UNDO, 'Undo', function() {
			self.editor.historyManager.undo();
		});
		this.historySet.buttons.push(this.buttonUndo);
		this.buttonRedo = new desktop.Button(self.editor.id + '_button_redo', imageDepot.REDO, 'Redo', function() {
			self.editor.historyManager.redo();
		});
		this.historySet.buttons.push(this.buttonRedo);
	};
	_.makeMeasurementsSet = function(self) {
		this.measurementsSet = new desktop.ButtonSet(self.editor.id + '_buttons_measurements');
		this.buttonDistance = new desktop.Button(self.editor.id + '_button_distance', imageDepot.DISTANCE, 'Distance', function() {
			self.editor.stateManager.STATE_MEASURE.numToSelect = 2;
			self.editor.stateManager.STATE_MEASURE.reset();
			self.editor.stateManager.setState(self.editor.stateManager.STATE_MEASURE);
		});
		this.measurementsSet.buttons.push(this.buttonDistance);
		this.buttonAngle = new desktop.Button(self.editor.id + '_button_angle', imageDepot.ANGLE, 'Angle', function() {
			self.editor.stateManager.STATE_MEASURE.numToSelect = 3;
			self.editor.stateManager.STATE_MEASURE.reset();
			self.editor.stateManager.setState(self.editor.stateManager.STATE_MEASURE);
		});
		this.measurementsSet.buttons.push(this.buttonAngle);
		this.buttonTorsion = new desktop.Button(self.editor.id + '_button_torsion', imageDepot.TORSION, 'Torsion', function() {
			self.editor.stateManager.STATE_MEASURE.numToSelect = 4;
			self.editor.stateManager.STATE_MEASURE.reset();
			self.editor.stateManager.setState(self.editor.stateManager.STATE_MEASURE);
		});
		this.measurementsSet.buttons.push(this.buttonTorsion);
	};

})(ChemDoodle, ChemDoodle.iChemLabs, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.uis.actions, ChemDoodle.uis.gui, ChemDoodle.uis.gui.imageDepot, ChemDoodle.uis.gui.desktop, ChemDoodle.uis.tools, ChemDoodle.uis.states, ChemDoodle.lib.jQuery, document);
//
//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
//

(function(c, desktop, q, document) {
	'use strict';
	desktop.SpecsDialog = function(editor, subid) {
		this.editor = editor;
		this.id = this.editor.id + subid;
	};
	var _ = desktop.SpecsDialog.prototype = new desktop.Dialog();
	_.title = 'Visual Specifications';
	
	_.makeProjectionSet = function(self) {
		this.projectionSet = new desktop.ButtonSet(self.id + '_projection_group');
		this.buttonPerspective = new desktop.TextButton(self.id + '_button_Perspective', 'Perspective',function() {
			self.editor.specs.projectionPerspective_3D = true;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.projectionSet.buttons.push(this.buttonPerspective);
		this.buttonOrthographic = new desktop.TextButton(self.id + '_button_Orthographic', 'Orthographic',function() {
			self.editor.specs.projectionPerspective_3D = false;
			self.editor.updateScene(self);
			self.update(editor.specs);
		});
		this.projectionSet.buttons.push(this.buttonOrthographic);
	};
	
	_.makeAtomColorSet = function(self) {
		this.atomColorSet = new desktop.ButtonSet(self.id + '_atom_color_group');
		this.atomColorSet.toggle = true;
		this.buttonJmolColors = new desktop.TextButton(self.id + '_button_Jmol_Colors', 'Jmol', function() {
			self.editor.specs.atoms_useJMOLColors = true;
			self.editor.specs.atoms_usePYMOLColors = false;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.atomColorSet.buttons.push(this.buttonJmolColors);
		this.buttonPymolColors = new desktop.TextButton(self.id + '_button_PyMOL_Colors', 'PyMOL', function() {
			self.editor.specs.atoms_usePYMOLColors = true;
			self.editor.specs.atoms_useJMOLColors = false;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.atomColorSet.buttons.push(this.buttonPymolColors);
	};
	
	_.makeBondColorSet = function(self) {
		this.bondColorSet = new desktop.ButtonSet(self.id + '_bond_color_group');
		this.bondColorSet.toggle = true;
		this.buttonJmolBondColors = new desktop.TextButton(self.id + '_button_Jmol_Bond_Colors', 'Jmol', function() {
			self.editor.specs.bonds_useJMOLColors = true;
			self.editor.specs.bonds_usePYMOLColors = false;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.bondColorSet.buttons.push(this.buttonJmolBondColors);
		this.buttonPymolBondColors = new desktop.TextButton(self.id + '_button_PyMOL_Bond_Colors', 'PyMOL', function() {
			self.editor.specs.bonds_usePYMOLColors = true;
			self.editor.specs.bonds_useJMOLColors = false;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.bondColorSet.buttons.push(this.buttonPymolBondColors);
	};
	
	_.makeCompassPositionSet = function(self) {
		this.compassPositionSet = new desktop.ButtonSet(self.id + '_compass_position_group');
		this.buttonCompassCorner = new desktop.TextButton(self.id + '_button_compass_corner', 'Corner',function() {
			self.editor.specs.compass_type_3D = 0;
			self.editor.specs.compass_size_3D = 50;
			self.editor.setupScene();
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.compassPositionSet.buttons.push(this.buttonCompassCorner);
		this.buttonCompassOrigin = new desktop.TextButton(self.id + '_button_compass_origin', 'Origin',function() {
			self.editor.specs.compass_type_3D = 1;
			self.editor.specs.compass_size_3D = 150;
			self.editor.setupScene();
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.compassPositionSet.buttons.push(this.buttonCompassOrigin);
	};
	
	_.makeFogModeSet = function(self) {
		this.fogModeSet = new desktop.ButtonSet(self.id + '_fog_mode_group');
		this.buttonFogMode0 = new desktop.TextButton(self.id + '_button_fog_mode_0', 'No Fogging', function() {
			self.editor.specs.fog_mode_3D = 0;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.fogModeSet.buttons.push(this.buttonFogMode0);
		this.buttonFogMode1 = new desktop.TextButton(self.id + '_button_fog_mode_1', 'Linear', function() {
			self.editor.specs.fog_mode_3D = 1;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.fogModeSet.buttons.push(this.buttonFogMode1);
		this.buttonFogMode2 = new desktop.TextButton(self.id + '_button_fog_mode_2', 'Exponential', function() {
			self.editor.specs.fog_mode_3D = 2;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.fogModeSet.buttons.push(this.buttonFogMode2);
		this.buttonFogMode3 = new desktop.TextButton(self.id + '_button_fog_mode_3', 'Exponential&sup2;', function() {
			self.editor.specs.fog_mode_3D = 3;
			self.editor.updateScene();
			self.update(editor.specs);
		});
		this.fogModeSet.buttons.push(this.buttonFogMode3);
	};
	
	_.setup = function(self, editor) {
		// canvas
		this.makeProjectionSet(this);
		this.bgcolor = new desktop.ColorPicker(this.id + '_bgcolor', 'Background Color: ', function(hex) {editor.specs.backgroundColor = hex;editor.setupScene();editor.repaint();self.update(editor.specs);});
		this.makeFogModeSet(this);
		this.fogcolor = new desktop.ColorPicker(this.id + '_fogcolor', 'Fog Color: ', function(hex) {editor.specs.fog_color_3D = hex;editor.setupScene();editor.repaint();self.update(editor.specs);});
		
		// atoms
		this.atomsDisplayToggle = new desktop.CheckBox(this.id + '_atoms_display_toggle', 'Display atoms', function() { editor.specs.atoms_display=!editor.specs.atoms_display;editor.updateScene();self.update(editor.specs);}, true);
		this.atomcolor = new desktop.ColorPicker(this.id + '_atomcolor', 'Atom Color: ', function(hex) {editor.specs.atoms_color = hex;editor.setupScene();editor.repaint();self.update(editor.specs);});
		this.makeAtomColorSet(this);
		this.atomColorSetToggle = new desktop.CheckBox(this.id + '_atom_color_group_toggle', 'Color Schemes', function() { 
				if (self.buttonJmolColors.getElement().prop('disabled')) { 
					self.atomColorSet.enable();
					editor.specs.atoms_useJMOLColors = true;
				} else { 
					self.atomColorSet.disable();
					editor.specs.atoms_useJMOLColors = false;
					editor.specs.atoms_usePYMOLColors = false;
					self.buttonJmolColors.uncheck();
					self.buttonPymolColors.uncheck();
				}
				editor.updateScene();
				self.update(editor.specs);
			}, false);
		this.vdwToggle = new desktop.CheckBox(this.id + '_vdw_toggle', 'Use VDW Diameters', function() { editor.specs.atoms_useVDWDiameters_3D=!editor.specs.atoms_useVDWDiameters_3D;editor.updateScene();self.update(editor.specs); }, false);
		this.atomsNonBondedAsStarsToggle = new desktop.CheckBox(this.id + '_non_bonded_as_stars_toggle', 'Non-bonded as stars', function() { editor.specs.atoms_nonBondedAsStars_3D=!editor.specs.atoms_nonBondedAsStars_3D;editor.updateScene();self.update(editor.specs); }, false);
		this.displayLabelsToggle = new desktop.CheckBox(this.id + '_display_labels_toggle', 'Atom labels', function() { editor.specs.atoms_displayLabels_3D=!editor.specs.atoms_displayLabels_3D;editor.updateScene();self.update(editor.specs); }, false);
		
		//bonds
		this.bondsDisplayToggle = new desktop.CheckBox(this.id + '_bonds_display_toggle', 'Display bonds', function() { editor.specs.bonds_display=!editor.specs.bonds_display;editor.updateScene();self.update(editor.specs);}, true);
		this.bondcolor = new desktop.ColorPicker(this.id + '_bondcolor', 'Bond Color: ', function(hex) {editor.specs.bonds_color = hex;editor.setupScene();editor.repaint();self.update(editor.specs);});
		this.makeBondColorSet(this);
		this.bondColorSetToggle =  new desktop.CheckBox(this.id + '_bond_color_group_toggle', 'Color Schemes', function() { 
			if (self.buttonJmolBondColors.getElement().prop('disabled')) { 
				self.bondColorSet.enable(); 
				editor.specs.bonds_useJMOLColors = true;
			} else { 
				self.bondColorSet.disable();
				editor.specs.bonds_useJMOLColors = false;
				editor.specs.bonds_usePYMOLColors = false;
				self.buttonJmolBondColors.uncheck();
				self.buttonPymolBondColors.uncheck();
				
			} 
			editor.updateScene();
			self.update(editor.specs);
		}, false);
		this.bondOrderToggle = new desktop.CheckBox(this.id + '_bond_order_toggle', 'Show order', function() { editor.specs.bonds_showBondOrders_3D=!editor.specs.bonds_showBondOrders_3D;editor.updateScene();self.update(editor.specs); }, false);
		this.bondsRenderAsLinesToggle = new desktop.CheckBox(this.id + '_bonds_render_as_lines_toggle', 'Render as lines', function() { editor.specs.bonds_renderAsLines_3D=!editor.specs.bonds_renderAsLines_3D;editor.updateScene();self.update(editor.specs);}, false);
		
		// proteins
		this.ribbonsToggle = new desktop.CheckBox(this.id + '_ribbons_toggle', 'Ribbons', function() { editor.specs.proteins_displayRibbon=!editor.specs.proteins_displayRibbon;editor.updateScene();self.update(editor.specs); }, false);
		this.backboneToggle = new desktop.CheckBox(this.id + '_backbone_toggle', 'Backbone', function() { editor.specs.proteins_displayBackbone=!editor.specs.proteins_displayBackbone;editor.updateScene();self.update(editor.specs); }, false);
		this.pipeplankToggle = new desktop.CheckBox(this.id + '_pipeplank_toggle', 'Pipe and Plank', function() { editor.specs.proteins_displayPipePlank=!editor.specs.proteins_displayPipePlank;editor.updateScene();self.update(editor.specs); }, false);
		this.cartoonizeToggle = new desktop.CheckBox(this.id + '_cartoonize_toggle', 'Cartoonize', function() { editor.specs.proteins_ribbonCartoonize=!editor.specs.proteins_ribbonCartoonize;editor.updateScene();self.update(editor.specs); }, false);
		this.colorByChainToggle = new desktop.CheckBox(this.id + '_color_by_chain_toggle', 'Color by Chain', function() { editor.specs.macro_colorByChain=!editor.specs.macro_colorByChain;editor.updateScene();self.update(editor.specs); }, false);
		this.proteinColorToggle = new desktop.CheckBox(this.id + '_protein_color_toggle', 'Color by Segment', function() { 
			if (self.proteinColorToggle.checked) {
				editor.specs.proteins_residueColor = 'none';
				self.proteinColorToggle.uncheck();
				q('#proteinColors').prop('disabled', true);
			} else {
				self.proteinColorToggle.check();
				q('#proteinColors').removeAttr('disabled');
				editor.specs.proteins_residueColor = q('#proteinColors').val();
			}
			editor.updateScene();
			self.update(editor.specs);}, false);
		
		//nucleics
		this.nucleicAcidColorToggle = new desktop.CheckBox(this.id + '_nucleic_acid_color_toggle', 'Color by Segment', function() { 
			if (self.nucleicAcidColorToggle.checked) {
				editor.specs.nucleics_residueColor = 'none';
				self.nucleicAcidColorToggle.uncheck();
				q('#nucleicColors').prop('disabled', true);
			} else {
				self.nucleicAcidColorToggle.check();
				q('#nucleicColors').removeAttr('disabled');
				editor.specs.nucleics_residueColor = q('#nucleicColors').val();
			}
			editor.updateScene();
			self.update(editor.specs);}, false);
		
		// text
		//this.boldTextToggle = new desktop.CheckBox(this.id + '_bold_text_toggle', 'Bold', function() { editor.specs.text_font_bold=!editor.specs.text_font_bold;editor.updateScene();self.update(editor.specs); }, false);
		//this.italicTextToggle = new desktop.CheckBox(this.id + '_italic_text_toggle', 'Italic', function() { editor.specs.text_font_italics=!editor.specs.text_font_italics;editor.updateScene();self.update(editor.specs); }, false);
		
		// shapes
		this.shapecolor = new desktop.ColorPicker(this.id + '_shapecolor', 'Shape Color: ', function(hex) {editor.specs.shapes_color = hex;editor.setupScene();editor.repaint();self.update(editor.specs);});
		
		// compass
		this.displayCompassToggle = new desktop.CheckBox(this.id + '_display_compass_toggle', 'Display Compass', function() { 
			if (self.displayCompassToggle.checked) { 
				editor.specs.compass_display = false;
				editor.setupScene();
				editor.updateScene();
				self.compassPositionSet.disable();
				self.buttonCompassCorner.uncheck();
				self.displayCompassToggle.uncheck();
				self.update(editor.specs);
			} else { 
				editor.specs.compass_display = true;
				editor.specs.compass_type_3D = 0;
				editor.specs.compass_size_3D = 50;
				self.compassPositionSet.enable();
				self.displayCompassToggle.check();
				self.buttonCompassCorner.check();
				editor.setupScene();
				editor.updateScene();
				self.update(editor.specs);
			} 
		}, false);
		this.makeCompassPositionSet(this);
		//this.axisLabelsToggle = new desktop.CheckBox(this.id + '_axis_labels_toggle', 'Axis Labels', function() { editor.specs.compass_displayText_3D=!editor.specs.compass_displayText_3D;editor.updateScene();self.update(editor.specs); }, false);
		
		var sb = [];
		sb.push('<div style="font-size:12px;text-align:left;overflow-y:scroll;height:300px;" id="');
		sb.push(this.id);
		sb.push('" title="');
		sb.push(this.title);
		sb.push('">');
		if (this.message) {
			sb.push('<p>');
			sb.push(this.message);
			sb.push('</p>');
		}
		sb.push('<p><strong>Representation</strong>');
		sb.push('<p><select id="reps"><option value="Ball and Stick">Ball and Stick</option><option value="van der Waals Spheres">vdW Spheres</option><option value="Stick">Stick</option><option value="Wireframe">Wireframe</option><option value="Line">Line</option></select></p>');
		sb.push('<hr><strong>Canvas</strong>');
		sb.push(this.bgcolor.getSource());
		sb.push('<p>Projection: ');
		sb.push(this.projectionSet.getSource(this.id + '_projection_group'));
		sb.push('</p><p>Fog Mode: ');
		sb.push(this.fogModeSet.getSource(this.id + '_fog_mode_group'));
		sb.push(this.fogcolor.getSource());
		sb.push('</p><p>Fog start: <input type="number" id="fogstart" min="0" max="100" value="0"> %</p>');
		sb.push('</p><p>Fog end: <input type="number" id="fogend" min="0" max="100" value="100"> %</p>');
		sb.push('</p><p>Fog density: <input type="number" id="fogdensity" min="0" max="100" value="100"> %</p>');
		sb.push('<hr><strong>Atoms</strong><p>');
		sb.push(this.atomsDisplayToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.atomcolor.getSource());
		sb.push('</p><p>Sphere diameter: <input type="number" id="spherediameter" min="0" max="40" value="0.8" step="0.01"> Angstroms</p>');
		sb.push(this.vdwToggle.getSource());
		sb.push('</p><p>VDW Multiplier: <input type="number" id="vdwMultiplier" min="0" max="100" value="100"> %</p>');
		sb.push(this.atomsNonBondedAsStarsToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.displayLabelsToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.atomColorSetToggle.getSource());
		sb.push(': ');
		sb.push(this.atomColorSet.getSource(this.id + '_atom_color_group'));
		sb.push('</p><hr><strong>Bonds</strong><p>');
		sb.push(this.bondsDisplayToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.bondcolor.getSource());
		sb.push(this.bondColorSetToggle.getSource());
		sb.push(': ');
		sb.push(this.bondColorSet.getSource(this.id + '_bond_color_group'));
		sb.push('</p><p>');
		sb.push(this.bondOrderToggle.getSource());
		sb.push('</p><p>Cylinder diameter: <input type="number" id="cylinderdiameter" min="0" max="40" value="0.3" step="0.01"> Angstroms</p>');
		sb.push('</p><hr><strong>Proteins</strong>');
		sb.push('<p>');
		sb.push(this.ribbonsToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.backboneToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.pipeplankToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.cartoonizeToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.colorByChainToggle.getSource());
		sb.push('</p><p>');
		sb.push(this.proteinColorToggle.getSource());
		sb.push('<select id="proteinColors" disabled><option value="amino">Amino</option><option value="shapely">Shapely</option><option value="polarity">Polarity</option><option value="rainbow">Rainbow</option><option value="acidity">Acidity</option></select></p>');
		sb.push('<hr><strong>Nucleic Acids</strong><p>');
		sb.push(this.nucleicAcidColorToggle.getSource());
		sb.push(': ');
		sb.push('<select id="nucleicColors" disabled><option value="shapely">Shapely</option><option value="rainbow">Rainbow</option></select></p>');
		//sb.push('<hr><strong>Text</strong>');
		//sb.push('<p><table style="font-size:12px;text-align:left;border-spacing:0px"><tr><td><p>Text Color: </p></td><td><input id="textcolor" name="textcolor" class="simple_color" value="#000000" /></td></tr></table></p>');
		//sb.push('<p>Font Styles: ');
		//sb.push(this.boldTextToggle.getSource());
		//sb.push(this.italicTextToggle.getSource());
		//sb.push('</p>');
		sb.push('<hr><strong>Shapes</strong><p>');
		sb.push(this.shapecolor.getSource());
		sb.push('</p><hr><strong>Compass</strong>');
		sb.push('<p>');
		sb.push(this.displayCompassToggle.getSource());
		sb.push(': ');
		sb.push(this.compassPositionSet.getSource(this.id + '_compass_position_group'));
		//sb.push('</p><p>');
		sb.push('</p>');
		//sb.push(this.axisLabelsToggle.getSource());
		//sb.push('</p><table style="font-size:12px;text-align:left;border-spacing:0px"><tr><td>Axis Colors: </td><td><label for="xaxis">X</label></td><td><input id="xaxis" name="xaxis" class="simple_color" value="#FF0000" /></td><td><label for="yaxis">Y</label></td><td><input id="yaxis" name="yaxis" class="simple_color" value="#00FF00" /></td><td><label for="zaxis">Z</label></td><td><input id="zaxis" name="zaxis" class="simple_color" value="#0000FF" /></td></tr></table>');
		sb.push('</div>');
		if (this.afterMessage) {
			sb.push('<p>');
			sb.push(this.afterMessage);
			sb.push('</p>');
		}
		document.writeln(sb.join(''));
		this.getElement().dialog({
			autoOpen : false,
			position : {my: "center", at:"center", of:document },
			buttons : self.buttons,
			width : 500,
			height: 300,
			open : function(event, ui) {
				q(this).height(300);
				q(this).width(478);
				q(this).dialog('option', 'position', 'center');
			}
		});
		this.bgcolor.setup();
		this.fogcolor.setup();
		this.atomcolor.setup();
		this.bondcolor.setup();
		this.shapecolor.setup();	
		q('#reps').change(function() {
			var i = this.selectedIndex;
			var ops = this.options;
			editor.specs.set3DRepresentation(ops[i].value);
			editor.updateScene();
			self.update(editor.specs);
		});
		q('#proteinColors').change(function() {
			var i = this.selectedIndex;
			switch(i) {
			case 0:
				editor.specs.proteins_residueColor = 'amino';
				break;
			case 1:
				editor.specs.proteins_residueColor = 'shapely';
				break;
			case 2:
				editor.specs.proteins_residueColor = 'polarity';
				break;
			case 3:
				editor.specs.proteins_residueColor = 'rainbow';
				break;
			case 4:
				editor.specs.proteins_residueColor = 'acidity';
				break;
			}
				
			editor.updateScene();
			self.update(editor.specs);
		});
		q('#nucleicColors').change(function() {
			var i = this.selectedIndex;
			switch(i) {
			case 0:
				editor.specs.nucleics_residueColor = 'shapely';
				break;
			case 1:
				editor.specs.nucleics_residueColor = 'rainbow';
				break;
			}
				
			editor.updateScene();
			self.update(editor.specs);
		});
		
		q('#fogstart').change(function() {
			editor.specs.fog_start_3D = parseInt(this.value)/100;
			editor.updateScene();
		});
		q('#fogend').change(function() {
			editor.specs.fog_end_3D = parseInt(this.value)/100;
			editor.updateScene();
		});
		q('#fogdensity').change(function() {
			editor.specs.fog_density_3D = parseInt(this.value)/100;
			editor.updateScene();
		});
		q('#vdwMultiplier').change(function() {
			editor.specs.atoms_vdwMultiplier_3D = parseInt(this.value)/100;
			editor.updateScene();
		});
		q('#spherediameter').change(function() {
			editor.specs.atoms_sphereDiameter_3D = parseFloat(this.value);
			editor.updateScene();
		});
		q('#cylinderdiameter').change(function() {
			editor.specs.bonds_cylinderDiameter_3D = parseFloat(this.value);
			editor.updateScene();
		});
		
		this.projectionSet.setup();
		this.fogModeSet.setup();
		this.atomsDisplayToggle.setup();
		this.vdwToggle.setup();
		this.atomsNonBondedAsStarsToggle.setup();
		this.displayLabelsToggle.setup();
		this.atomColorSet.setup();
		this.atomColorSet.disable();
		this.atomColorSetToggle.setup();
		this.bondsDisplayToggle.setup();
		this.bondColorSet.setup();
		this.bondColorSet.disable();
		this.bondColorSetToggle.setup();
		this.bondOrderToggle.setup();
		this.ribbonsToggle.setup();
		this.backboneToggle.setup();
		this.pipeplankToggle.setup();
		this.cartoonizeToggle.setup();
		this.colorByChainToggle.setup();
		this.proteinColorToggle.setup();
		this.nucleicAcidColorToggle.setup();
		//this.boldTextToggle.setup();
		//this.italicTextToggle.setup();
		this.displayCompassToggle.setup();
		this.compassPositionSet.setup();
		this.compassPositionSet.disable();
		//this.axisLabelsToggle.setup();
	};
	_.update = function(specs){
		this.bgcolor.setColor(specs.backgroundColor);
		this.fogcolor.setColor(specs.fog_color_3D);
		this.atomcolor.setColor(specs.atoms_color);
		this.bondcolor.setColor(specs.bonds_color);
		this.shapecolor.setColor(specs.shapes_color);
		if (specs.projectionPerspective_3D) {
			this.buttonPerspective.select();
		} else {
			this.buttonOrthographic.select();
		}
		switch(specs.fog_mode_3D) {
		case 1:
			this.buttonFogMode0.uncheck();
			this.buttonFogMode1.check();
			this.buttonFogMode2.uncheck();
			this.buttonFogMode3.uncheck();
			break;
		case 2:
			this.buttonFogMode0.uncheck();
			this.buttonFogMode1.uncheck();
			this.buttonFogMode2.check();
			this.buttonFogMode3.uncheck();
			break;
		case 3:
			this.buttonFogMode0.uncheck();
			this.buttonFogMode1.uncheck();
			this.buttonFogMode2.uncheck();
			this.buttonFogMode3.check();
			break;
		default:
			this.buttonFogMode0.check();
			this.buttonFogMode1.uncheck();
			this.buttonFogMode2.uncheck();
			this.buttonFogMode3.uncheck();
			break;
		}
		q('#fogstart').val(specs.fog_start_3D * 100);
		q('#fogend').val(specs.fog_end_3D * 100);
		q('#fogdensity').val(specs.fog_density_3D * 100);
		if (specs.atoms_display) {
			this.atomsDisplayToggle.check();
		} else {
			this.atomsDisplayToggle.uncheck();
		}
		if (specs.atoms_useVDWDiameters_3D) {
			this.vdwToggle.check();
			q('#spherediameter').prop('disabled', true);
			q('#vdwMultiplier').prop('disabled', false);
			q('#vdwMultiplier').val(specs.atoms_vdwMultiplier_3D * 100);
		} else {
			this.vdwToggle.uncheck();
			q('#spherediameter').prop('disabled', false);
			q('#spherediameter').val(specs.atoms_sphereDiameter_3D);
			q('#vdwMultiplier').prop('disabled', true);
		}
		if (specs.atoms_useJMOLColors || specs.atoms_usePYMOLColors) {
			this.atomColorSetToggle.check();
			this.atomColorSet.enable();
			if (specs.atoms_useJMOLColors) {
				this.buttonJmolColors.check();
				this.buttonPymolColors.uncheck();
			} else if (specs.atoms_usePYMOLColors) {
				this.buttonJmolColors.uncheck();
				this.buttonPymolColors.check();
			}
		} else {
			this.atomColorSetToggle.uncheck();
			this.buttonPymolColors.uncheck();
			this.buttonJmolColors.uncheck();
			this.atomColorSet.disable();
		}
		if (specs.atoms_nonBondedAsStars_3D) {
			this.atomsNonBondedAsStarsToggle.check();
		} else {
			this.atomsNonBondedAsStarsToggle.uncheck();
		}
		if (specs.atoms_displayLabels_3D) {
			this.displayLabelsToggle.check();
		} else {
			this.displayLabelsToggle.uncheck();
		}
		if (specs.bonds_display) {
			this.bondsDisplayToggle.check();
		} else {
			this.bondsDisplayToggle.uncheck();
		}
		if (specs.bonds_useJMOLColors || specs.bonds_usePYMOLColors) {
			this.bondColorSetToggle.check();
			this.bondColorSet.enable();
			if (specs.bonds_useJMOLColors) {
				this.buttonJmolBondColors.check();
				this.buttonPymolBondColors.uncheck();
			} else if (specs.atoms_usePYMOLColors) {
				this.buttonJmolBondColors.uncheck();
				this.buttonPymolBondColors.check();
			}
		} else {
			this.bondColorSetToggle.uncheck();
			this.buttonPymolBondColors.uncheck();
			this.buttonJmolBondColors.uncheck();
			this.bondColorSet.disable();
		}
		if (specs.bonds_showBondOrders_3D) {
			this.bondOrderToggle.check();
		} else {
			this.bondOrderToggle.uncheck();
		}
		q('#cylinderdiameter').val(specs.bonds_cylinderDiameter_3D);
		if (specs.proteins_displayRibbon) {
			this.ribbonsToggle.check();
		} else {
			this.ribbonsToggle.uncheck();
		}
		if (specs.proteins_displayBackbone) {
			this.backboneToggle.check();
		} else {
			this.backboneToggle.uncheck();
		}
		if (specs.proteins_displayPipePlank) {
			this.pipeplankToggle.check();
		} else {
			this.pipeplankToggle.uncheck();
		}
		if (specs.proteins_ribbonCartoonize) {
			this.cartoonizeToggle.check();
		} else {
			this.cartoonizeToggle.uncheck();
		}
		if (specs.macro_colorByChain) {
			this.colorByChainToggle.check();
		} else {
			this.colorByChainToggle.uncheck();
		}
		switch (specs.proteins_residueColor) {
		case 'amino':
			this.proteinColorToggle.check();
			q('#proteinColors').val('amino');
			break;
		case 'shapely':
			this.proteinColorToggle.check();
			q('#proteinColors').val('shapely');
			break;
		case 'polarity':
			this.proteinColorToggle.check();
			q('#proteinColors').val('polarity');
			break;
		case 'rainbow':
			this.proteinColorToggle.check();
			q('#proteinColors').val('rainbow');
			break;
		case 'acidity':
			this.proteinColorToggle.check();
			q('#proteinColors').val('acidity');
			break;
		case 'none':
		default:
			this.proteinColorToggle.uncheck();
			q('#proteinColors').prop('disabled', true);
			break;
		}
		switch (specs.nucleics_residueColor) {
		case 'shapely':
			this.nucleicAcidColorToggle.check();
			q('#nucleicColors').val('shapely');
			break;
		case 'rainbow':
			this.nucleicAcidColorToggle.check();
			q('#nucleicColors').val('rainbow');
			break;
		case 'none':
		default:
			this.nucleicAcidColorToggle.uncheck();
			q('#nucleicColors').prop('disabled', true);
			break;
		}
		/*
		if (specs.text_font_bold) {
			this.boldTextToggle.check();
		}
		if (specs.text_font_italic) {
			this.italicTextToggle.check();
		}*/
		if (specs.compass_display == true) {
			this.compassPositionSet.enable();
			if (specs.compass_type_3D == 0) {
				this.buttonCompassCorner.check();
				this.buttonCompassOrigin.uncheck();
			} else {
				this.buttonCompassOrigin.check();
				this.buttonCompassCorner.uncheck();
			}
		} else {
			this.compassPositionSet.disable();
			this.buttonCompassCorner.uncheck();
			this.buttonCompassOrigin.uncheck();
		}
		/*if (specs.compass_display_text_3D) {
			this.axisLabelsToggle.check();
		} else {
			this.axisLabelsToggle.uncheck();
		} */
	};

})(ChemDoodle, ChemDoodle.uis.gui.desktop, ChemDoodle.lib.jQuery, document);