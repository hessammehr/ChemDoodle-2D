function attachIO(ChemDoodle) {
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//
	(function(io) {
		'use strict';
		io._Interpreter = function() {
		};
		var _ = io._Interpreter.prototype;
		_.fit = function(data, length, leftAlign) {
			var size = data.length;
			var padding = [];
			for ( var i = 0; i < length - size; i++) {
				padding.push(' ');
			}
			return leftAlign ? data + padding.join('') : padding.join('') + data;
		};

	})(ChemDoodle.io);

	//
	// Copyright 2009-2015 iChemLabs, LLC. All rights reserved.
	//
	(function(c, io, structures, q) {
		'use strict';
		io.CMLInterpreter = function() {
		};
		var _ = io.CMLInterpreter.prototype = new io._Interpreter();
		_.read = function(content) {
			var molecules = [];
			var xml = q.parseXML(content);
			// Possible for multiple CML tags to exist
			var allCml = q(xml).find('cml');
			for (var i = 0, ii = allCml.length; i < ii; i++){
				var allMolecules = q(allCml[i]).find('molecule');
				for (var j = 0, jj = allMolecules.length; j < jj; j++) {
					var currentMolecule = molecules[j] = new structures.Molecule();
					var idmap = [];
					// Don't even bother with atomArrays, there's no point.
					var cmlAtoms = q(allMolecules[j]).find('atom');
					for (var k = 0, kk = cmlAtoms.length; k < kk; k++) {
						var currentCMLAtom = q(cmlAtoms[k]);
						var label = currentCMLAtom.attr('elementType');
						var x, y, z, currentAtom;
						if (currentCMLAtom.attr('x2') == undefined) {
							x = currentCMLAtom.attr('x3');
							y = currentCMLAtom.attr('y3');
							z = currentCMLAtom.attr('z3');
						} else {
							x = currentCMLAtom.attr('x2');
							y = currentCMLAtom.attr('y2');
							z = 0;
						}
						currentAtom = molecules[j].atoms[k] = new structures.Atom(label, x, y, z);
						idmap[k] = currentCMLAtom.attr('id');
						// charge
						if (currentCMLAtom.attr('formalCharge') != undefined) {
							currentAtom.charge = currentCMLAtom.attr('formalCharge');
						}

					}
					var cmlBonds = q(allMolecules[j]).find('bond');
					for (var k = 0, kk = cmlBonds.length; k < kk; k++) {
						var currentCMLBond = q(cmlBonds[k]);
						var atomRefs2 = currentCMLBond.attr('atomRefs2').split(' ');
						var a1, a2, order;
						a1 = currentMolecule.atoms[q.inArray(atomRefs2[0], idmap)];
						a2 = currentMolecule.atoms[q.inArray(atomRefs2[1], idmap)];
						switch(currentCMLBond.attr('order')) {
						case '2':
						case 'D':
							order = 2;
							break;
						case '3':
						case 'T':
							order = 3;
							break;
						case 'A':
							order = 1.5;
							break;
						default:
							order = 1;	 
						}
						var currentBond = molecules[j].bonds[k] = new structures.Bond(a1, a2, order);
						// check stereo... only support W or H
						switch (currentCMLBond.find('bondStereo').text()) {
						case 'W':
							currentBond.stereo = structures.Bond.STEREO_PROTRUDING;
							break;
						case 'H':
							currentBond.stereo = structures.Bond.STEREO_RECESSED;
							break;
						}
					}
				}
			}
			return molecules;
		};
		_.write = function(molecules) {
			var sb = [];
			sb.push('<?xml version="1.0" encoding="UTF-8"?>\n');
			sb.push('<cml convention="conventions:molecular" xmlns="http://www.xml-cml.org/schema" xmlns:conventions="http://www.xml-cml.org/convention/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n');
			// TODO: Metadata
			for (var i = 0, ii = molecules.length; i < ii; i++) {
				sb.push('<molecule id="m'); 
				sb.push(i); 
				sb.push('">');
				sb.push('<atomArray>');
				for (var j = 0, jj = molecules[i].atoms.length; j < jj; j++) {
					var currentAtom = molecules[i].atoms[j];
					sb.push('<atom elementType="'); 
					sb.push(currentAtom.label); 
					sb.push('" id="a');
					sb.push(j); 
					sb.push('" ');
					// Always do 3D coordinates, unless there is a fancy reliable way to tell if the molecule is 2D.
					sb.push('x3="');
					sb.push(currentAtom.x);
					sb.push('" y3="');
					sb.push(currentAtom.y);
					sb.push('" z3="');
					sb.push(currentAtom.z);
					sb.push('" ');
					if (currentAtom.charge != 0) {
						sb.push('formalCharge="');
						sb.push(currentAtom.charge);
						sb.push('" ');
					}
					sb.push('/>');
				}
				sb.push('</atomArray>');
				sb.push('<bondArray>');
				for (var j = 0, jj = molecules[i].bonds.length; j < jj; j++) {
					var currentBond = molecules[i].bonds[j];
					sb.push('<bond atomRefs2="a');
					sb.push(molecules[i].atoms.indexOf(currentBond.a1));
					sb.push(' a');
					sb.push(molecules[i].atoms.indexOf(currentBond.a2));
					sb.push('" order="');
					switch(currentBond.bondOrder) {
					case 1.5:
						sb.push('A');
						break;
					case 1:
					case 2:
					case 3:
						sb.push(currentBond.bondOrder);
						break;
					case 0.5:
					default:
						sb.push('S');
					break;
					}
					sb.push('"/>');
				}
				sb.push('</bondArray>');
				sb.push('</molecule>');
			}
			sb.push('</cml>');
			return sb.join('');
		};

		// shortcuts
		var interpreter = new io.CMLInterpreter();
		c.readCML = function(content) {
			return interpreter.read(content);
		};
		c.writeCML = function(molecules) {
			return interpreter.write(molecules);
		};
		
	})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.lib.jQuery);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(c, ELEMENT, io, structures) {
		'use strict';
		io.MOLInterpreter = function() {
		};
		var _ = io.MOLInterpreter.prototype = new io._Interpreter();
		_.read = function(content, multiplier) {
			if (!multiplier) {
				multiplier = c.default_bondLength_2D;
			}
			var molecule = new structures.Molecule();
			if (!content) {
				return molecule;
			}
			var currentTagTokens = content.split('\n');

			var counts = currentTagTokens[3];
			var numAtoms = parseInt(counts.substring(0, 3));
			var numBonds = parseInt(counts.substring(3, 6));

			for ( var i = 0; i < numAtoms; i++) {
				var line = currentTagTokens[4 + i];
				molecule.atoms[i] = new structures.Atom(line.substring(31, 34), parseFloat(line.substring(0, 10)) * multiplier, (multiplier === 1 ? 1 : -1) * parseFloat(line.substring(10, 20)) * multiplier, parseFloat(line.substring(20, 30)) * multiplier);
				var massDif = parseInt(line.substring(34, 36));
				if (massDif !== 0 && ELEMENT[molecule.atoms[i].label]) {
					molecule.atoms[i].mass = ELEMENT[molecule.atoms[i].label].mass + massDif;
				}
				switch (parseInt(line.substring(36, 39))) {
				case 1:
					molecule.atoms[i].charge = 3;
					break;
				case 2:
					molecule.atoms[i].charge = 2;
					break;
				case 3:
					molecule.atoms[i].charge = 1;
					break;
				case 5:
					molecule.atoms[i].charge = -1;
					break;
				case 6:
					molecule.atoms[i].charge = -2;
					break;
				case 7:
					molecule.atoms[i].charge = -3;
					break;
				}
			}
			for ( var i = 0; i < numBonds; i++) {
				var line = currentTagTokens[4 + numAtoms + i];
				var bondOrder = parseInt(line.substring(6, 9));
				var stereo = parseInt(line.substring(9, 12));
				if (bondOrder > 3) {
					switch (bondOrder) {
					case 4:
						bondOrder = 1.5;
						break;
					default:
						bondOrder = 1;
						break;
					}
				}
				var b = new structures.Bond(molecule.atoms[parseInt(line.substring(0, 3)) - 1], molecule.atoms[parseInt(line.substring(3, 6)) - 1], bondOrder);
				switch (stereo) {
				case 3:
					b.stereo = structures.Bond.STEREO_AMBIGUOUS;
					break;
				case 1:
					b.stereo = structures.Bond.STEREO_PROTRUDING;
					break;
				case 6:
					b.stereo = structures.Bond.STEREO_RECESSED;
					break;
				}
				molecule.bonds[i] = b;
			}
			return molecule;
		};
		_.write = function(molecule) {
			var sb = [];
			sb.push('Molecule from ChemDoodle Web Components\n\nhttp://www.ichemlabs.com\n');
			sb.push(this.fit(molecule.atoms.length.toString(), 3));
			sb.push(this.fit(molecule.bonds.length.toString(), 3));
			sb.push('  0  0  0  0            999 V2000\n');
			var p = molecule.getCenter();
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				var a = molecule.atoms[i];
				var mass = ' 0';
				if (a.mass !== -1 && ELEMENT[a.label]) {
					var dif = a.mass - ELEMENT[a.label].mass;
					if (dif < 5 && dif > -4) {
						mass = (dif > -1 ? ' ' : '') + dif;
					}
				}
				var charge = '  0';
				if (a.charge !== 0) {
					switch (a.charge) {
					case 3:
						charge = '  1';
						break;
					case 2:
						charge = '  2';
						break;
					case 1:
						charge = '  3';
						break;
					case -1:
						charge = '  5';
						break;
					case -2:
						charge = '  6';
						break;
					case -3:
						charge = '  7';
						break;
					}
				}
				sb.push(this.fit(((a.x - p.x) / c.default_bondLength_2D).toFixed(4), 10));
				sb.push(this.fit((-(a.y - p.y) / c.default_bondLength_2D).toFixed(4), 10));
				sb.push(this.fit((a.z / c.default_bondLength_2D).toFixed(4), 10));
				sb.push(' ');
				sb.push(this.fit(a.label, 3, true));
				sb.push(mass);
				sb.push(charge);
				sb.push('  0  0  0  0\n');
			}
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				var b = molecule.bonds[i];
				var stereo = 0;
				if (b.stereo === structures.Bond.STEREO_AMBIGUOUS) {
					stereo = 3;
				} else if (b.stereo === structures.Bond.STEREO_PROTRUDING) {
					stereo = 1;
				} else if (b.stereo === structures.Bond.STEREO_RECESSED) {
					stereo = 6;
				}
				sb.push(this.fit((molecule.atoms.indexOf(b.a1) + 1).toString(), 3));
				sb.push(this.fit((molecule.atoms.indexOf(b.a2) + 1).toString(), 3));
				var btype = b.bondOrder;
				if(btype==1.5){
					btype = 4;
				}else if(btype>3 || btype%1!=0){
					btype = 1;
				}
				sb.push(this.fit(btype, 3));
				sb.push('  ');
				sb.push(stereo);
				sb.push('     0  0\n');
			}
			sb.push('M  END');
			return sb.join('');
		};

		// shortcuts
		var interpreter = new io.MOLInterpreter();
		c.readMOL = function(content, multiplier) {
			return interpreter.read(content, multiplier);
		};
		c.writeMOL = function(mol) {
			return interpreter.write(mol);
		};

	})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.io, ChemDoodle.structures);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(c, extensions, io, structures, ELEMENT, trim, m) {
		'use strict';
		function checkContained(residue, set, chainID, index, helix) {
			for ( var j = 0, jj = set.length; j < jj; j++) {
				var check = set[j];
				if (check.id === chainID && index >= check.start && index <= check.end) {
					if (helix) {
						residue.helix = true;
					} else {
						residue.sheet = true;
					}
					if (index === check.end) {
						residue.arrow = true;
					}
					return;
				}
			}
		}
		
		io.PDBInterpreter = function() {
		};
		var _ = io.PDBInterpreter.prototype = new io._Interpreter();
		_.calculateRibbonDistances = false;
		_.deduceResidueBonds = false;
		_.read = function(content, multiplier) {
			var molecule = new structures.Molecule();
			molecule.chains = [];
			if (!content) {
				return molecule;
			}
			var currentTagTokens = content.split('\n');
			if (!multiplier) {
				multiplier = 1;
			}
			var helices = [];
			var sheets = [];
			var lastC;
			var currentChain = [];
			var resatoms = [];
			var atomSerials = [];
			for ( var i = 0, ii = currentTagTokens.length; i < ii; i++) {
				var line = currentTagTokens[i];
				if (extensions.stringStartsWith(line, 'HELIX')) {
					helices.push({
						id : line.substring(19, 20),
						start : parseInt(line.substring(21, 25)),
						end : parseInt(line.substring(33, 37))
					});
				} else if (extensions.stringStartsWith(line, 'SHEET')) {
					sheets.push({
						id : line.substring(21, 22),
						start : parseInt(line.substring(22, 26)),
						end : parseInt(line.substring(33, 37))
					});
				} else if (extensions.stringStartsWith(line, 'ATOM')) {
					var altLoc = line.substring(16, 17);
					if (altLoc === ' ' || altLoc === 'A') {
						var label = trim(line.substring(76, 78));
						if (label.length === 0) {
							var s = trim(line.substring(12, 14));
							if (s === 'HD') {
								label = 'H';
							} else if (s.length > 0) {
								if (s.length > 1) {
									label = s.charAt(0) + s.substring(1).toLowerCase();
								} else {
									label = s;
								}
							}
						}
						var a = new structures.Atom(label, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
						a.hetatm = false;
						resatoms.push(a);
						// set up residue
						var resSeq = parseInt(line.substring(22, 26));
						if (currentChain.length === 0) {
							for ( var j = 0; j < 3; j++) {
								var dummyFront = new structures.Residue(-1);
								dummyFront.cp1 = a;
								dummyFront.cp2 = a;
								currentChain.push(dummyFront);
							}
						}
						if (resSeq !== Number.NaN && currentChain[currentChain.length - 1].resSeq !== resSeq) {
							var r = new structures.Residue(resSeq);
							r.name = trim(line.substring(17, 20));
							if (r.name.length === 3) {
								r.name = r.name.substring(0, 1) + r.name.substring(1).toLowerCase();
							} else {
								if (r.name.length === 2 && r.name.charAt(0) === 'D') {
									r.name = r.name.substring(1);
								}
							}
							currentChain.push(r);
							var chainID = line.substring(21, 22);
							checkContained(r, helices, chainID, resSeq, true);
							checkContained(r, sheets, chainID, resSeq, false);
						}
						// end residue setup
						var atomName = trim(line.substring(12, 16));
						var currentResidue = currentChain[currentChain.length - 1];
						if (atomName === 'CA' || atomName === 'P' || atomName === 'O5\'') {
							if (!currentResidue.cp1) {
								currentResidue.cp1 = a;
							}
						} else if (atomName === 'N3' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'N1' && (currentResidue.name === 'A' || currentResidue.name === 'G')) {
							// control points for base platform direction
							currentResidue.cp3 = a;
						} else if (atomName === 'C2') {
							// control points for base platform orientation
							currentResidue.cp4 = a;
						} else if (atomName === 'C4' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'C6' && (currentResidue.name === 'A' || currentResidue.name === 'G')) {
							// control points for base platform orientation
							currentResidue.cp5 = a;
						} else if (atomName === 'O' || atomName === 'C6' && (currentResidue.name === 'C' || currentResidue.name === 'U' || currentResidue.name === 'T') || atomName === 'N9') {
							if (!currentChain[currentChain.length - 1].cp2) {
								if (atomName === 'C6' || atomName === 'N9') {
									lastC = a;
								}
								currentResidue.cp2 = a;
							}
						} else if (atomName === 'C') {
							lastC = a;
						}
					}
				} else if (extensions.stringStartsWith(line, 'HETATM')) {
					var symbol = trim(line.substring(76, 78));
					if (symbol.length === 0) {
						// handle the case where an improperly formatted PDB
						// file states the element label in the atom name column
						symbol = trim(line.substring(12, 16));
					}
					if (symbol.length > 1) {
						symbol = symbol.substring(0, 1) + symbol.substring(1).toLowerCase();
					}
					var het = new structures.Atom(symbol, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
					het.hetatm = true;
					var residueName = trim(line.substring(17, 20));
					if (residueName === 'HOH') {
						het.isWater = true;
					}
					molecule.atoms.push(het);
					atomSerials[parseInt(trim(line.substring(6, 11)))] = het;
				} else if (extensions.stringStartsWith(line, 'CONECT')) {
					var oid = parseInt(trim(line.substring(6, 11)));
					if (atomSerials[oid]) {
						var origin = atomSerials[oid];
						for ( var k = 0; k < 4; k++) {
							var next = trim(line.substring(11 + k * 5, 16 + k * 5));
							if (next.length !== 0) {
								var nid = parseInt(next);
								if (atomSerials[nid]) {
									var a2 = atomSerials[nid];
									var found = false;
									for ( var j = 0, jj = molecule.bonds.length; j < jj; j++) {
										var b = molecule.bonds[j];
										if (b.a1 === origin && b.a2 === a2 || b.a1 === a2 && b.a2 === origin) {
											found = true;
											break;
										}
									}
									if (!found) {
										molecule.bonds.push(new structures.Bond(origin, a2));
									}
								}
							}
						}
					}
				} else if (extensions.stringStartsWith(line, 'TER')) {
					this.endChain(molecule, currentChain, lastC, resatoms);
					currentChain = [];
				} else if (extensions.stringStartsWith(line, 'ENDMDL')) {
					break;
				}
			}
			this.endChain(molecule, currentChain, lastC, resatoms);
			if (molecule.bonds.size === 0) {
				new c.informatics.BondDeducer().deduceCovalentBonds(molecule, multiplier);
			}
			if (this.deduceResidueBonds) {
				for ( var i = 0, ii = resatoms.length; i < ii; i++) {
					var max = m.min(ii, i + 20);
					for ( var j = i + 1; j < max; j++) {
						var first = resatoms[i];
						var second = resatoms[j];
						if (first.distance3D(second) < (ELEMENT[first.label].covalentRadius + ELEMENT[second.label].covalentRadius) * 1.1) {
							molecule.bonds.push(new structures.Bond(first, second, 1));
						}
					}
				}
			}
			molecule.atoms = molecule.atoms.concat(resatoms);
			if (this.calculateRibbonDistances) {
				this.calculateDistances(molecule, resatoms);
			}
			return molecule;
		};
		_.endChain = function(molecule, chain, lastC, resatoms) {
			if (chain.length > 0) {
				var last = chain[chain.length - 1];
				if (!last.cp1) {
					last.cp1 = resatoms[resatoms.length - 2];
				}
				if (!last.cp2) {
					last.cp2 = resatoms[resatoms.length - 1];
				}
				for ( var i = 0; i < 4; i++) {
					var dummyEnd = new structures.Residue(-1);
					dummyEnd.cp1 = lastC;
					dummyEnd.cp2 = chain[chain.length - 1].cp2;
					chain.push(dummyEnd);
				}
				molecule.chains.push(chain);
			}
		};
		_.calculateDistances = function(molecule, resatoms) {
			var hetatm = [];
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				var a = molecule.atoms[i];
				if (a.hetatm) {
					if (!a.isWater) {
						hetatm.push(a);
					}
				}
			}
			for ( var i = 0, ii = resatoms.length; i < ii; i++) {
				var a = resatoms[i];
				a.closestDistance = Number.POSITIVE_INFINITY;
				if (hetatm.length === 0) {
					a.closestDistance = 0;
				} else {
					for ( var j = 0, jj = hetatm.length; j < jj; j++) {
						a.closestDistance = Math.min(a.closestDistance, a.distance3D(hetatm[j]));
					}
				}
			}
		};

		// shortcuts
		var interpreter = new io.PDBInterpreter();
		c.readPDB = function(content, multiplier) {
			return interpreter.read(content, multiplier);
		};

	})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.ELEMENT, ChemDoodle.lib.jQuery.trim, Math);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(c, extensions, io, structures, q) {
		'use strict';
		var SQZ_HASH = {
			'@' : 0,
			'A' : 1,
			'B' : 2,
			'C' : 3,
			'D' : 4,
			'E' : 5,
			'F' : 6,
			'G' : 7,
			'H' : 8,
			'I' : 9,
			'a' : -1,
			'b' : -2,
			'c' : -3,
			'd' : -4,
			'e' : -5,
			'f' : -6,
			'g' : -7,
			'h' : -8,
			'i' : -9
		}, DIF_HASH = {
			'%' : 0,
			'J' : 1,
			'K' : 2,
			'L' : 3,
			'M' : 4,
			'N' : 5,
			'O' : 6,
			'P' : 7,
			'Q' : 8,
			'R' : 9,
			'j' : -1,
			'k' : -2,
			'l' : -3,
			'm' : -4,
			'n' : -5,
			'o' : -6,
			'p' : -7,
			'q' : -8,
			'r' : -9
		}, DUP_HASH = {
			'S' : 1,
			'T' : 2,
			'U' : 3,
			'V' : 4,
			'W' : 5,
			'X' : 6,
			'Y' : 7,
			'Z' : 8,
			's' : 9
		};

		io.JCAMPInterpreter = function() {
		};
		var _ = io.JCAMPInterpreter.prototype = new io._Interpreter();
		_.convertHZ2PPM = false;
		_.read = function(content) {
			this.isBreak = function(c) {
				// some of these arrays may return zero, so check if undefined
				return SQZ_HASH[c] !== undefined || DIF_HASH[c] !== undefined || DUP_HASH[c] !== undefined || c === ' ' || c === '-' || c === '+';
			};
			this.getValue = function(decipher, lastDif) {
				var first = decipher.charAt(0);
				var rest = decipher.substring(1);
				// some of these arrays may return zero, so check if undefined
				if (SQZ_HASH[first] !== undefined) {
					return parseFloat(SQZ_HASH[first] + rest);
				} else if (DIF_HASH[first] !== undefined) {
					return parseFloat(DIF_HASH[first] + rest) + lastDif;
				}
				return parseFloat(rest);
			};
			var spectrum = new structures.Spectrum();
			if (content === undefined || content.length === 0) {
				return spectrum;
			}
			var lines = content.split('\n');
			var sb = [];
			var xLast, xFirst, yFirst, nPoints, xFactor = 1, yFactor = 1, observeFrequency = 1, deltaX = -1, shiftOffsetNum = -1, shiftOffsetVal = -1;
			var recordMeta = true, divideByFrequency = false;
			for ( var i = 0, ii = lines.length; i < ii; i++) {
				var use = lines[i].trim();
				var index = use.indexOf('$$');
				if (index !== -1) {
					use = use.substring(0, index);
				}
				if (sb.length === 0 || !extensions.stringStartsWith(lines[i], '##')) {
					var trimmed = use.trim();
					if (sb.length !== 0 && trimmed.length!==0) {
						sb.push('\n');
					}
					sb.push(trimmed);
				} else {
					var currentRecord = sb.join('');
					if (recordMeta && currentRecord.length < 100) {
						spectrum.metadata.push(currentRecord);
					}
					sb = [ use ];
					if (extensions.stringStartsWith(currentRecord, '##TITLE=')) {
						spectrum.title = currentRecord.substring(8).trim();
					} else if (extensions.stringStartsWith(currentRecord, '##XUNITS=')) {
						spectrum.xUnit = currentRecord.substring(9).trim();
						if (this.convertHZ2PPM && spectrum.xUnit.toUpperCase() === 'HZ') {
							spectrum.xUnit = 'PPM';
							divideByFrequency = true;
						}
					} else if (extensions.stringStartsWith(currentRecord, '##YUNITS=')) {
						spectrum.yUnit = currentRecord.substring(9).trim();
					} else if (extensions.stringStartsWith(currentRecord, '##XYPAIRS=')) {
						// spectrum.yUnit = currentRecord.substring(9).trim();
					} else if (extensions.stringStartsWith(currentRecord, '##FIRSTX=')) {
						xFirst = parseFloat(currentRecord.substring(9).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##LASTX=')) {
						xLast = parseFloat(currentRecord.substring(8).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##FIRSTY=')) {
						yFirst = parseFloat(currentRecord.substring(9).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##NPOINTS=')) {
						nPoints = parseFloat(currentRecord.substring(10).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##XFACTOR=')) {
						xFactor = parseFloat(currentRecord.substring(10).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##YFACTOR=')) {
						yFactor = parseFloat(currentRecord.substring(10).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##DELTAX=')) {
						deltaX = parseFloat(currentRecord.substring(9).trim());
					} else if (extensions.stringStartsWith(currentRecord, '##.OBSERVE FREQUENCY=')) {
						if (this.convertHZ2PPM) {
							observeFrequency = parseFloat(currentRecord.substring(21).trim());
						}
					} else if (extensions.stringStartsWith(currentRecord, '##.SHIFT REFERENCE=')) {
						if (this.convertHZ2PPM) {
							var parts = currentRecord.substring(19).split(',');
							shiftOffsetNum = parseInt(parts[2].trim());
							shiftOffsetVal = parseFloat(parts[3].trim());
						}
					} else if (extensions.stringStartsWith(currentRecord, '##XYDATA=')) {
						if (!divideByFrequency) {
							observeFrequency = 1;
						}
						recordMeta = false;
						var lastWasDif = false;
						var innerLines = currentRecord.split('\n');
						var abscissaSpacing = (xLast - xFirst) / (nPoints - 1);
						// use provided deltaX if determined to be compressed
						// and discontinuous
						if (deltaX !== -1) {
							for ( var j = 1, jj = innerLines.length; j < jj; j++) {
								if (innerLines[j].charAt(0) === '|') {
									abscissaSpacing = deltaX;
									break;
								}
							}
						}
						var lastX = xFirst - abscissaSpacing;
						var lastY = yFirst;
						var lastDif = 0;
						var lastOrdinate;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var data = [];
							var read = innerLines[j].trim();
							var sb = [];
							var isCompressedDiscontinuous = false;
							for ( var k = 0, kk = read.length; k < kk; k++) {
								if (this.isBreak(read.charAt(k))) {
									if (sb.length > 0 && !(sb.length === 1 && sb[0] === ' ')) {
										data.push(sb.join(''));
									}
									sb = [ read.charAt(k) ];
								} else {
									if (read.charAt(k) === '|') {
										isCompressedDiscontinuous = true;
									} else {
										sb.push(read.charAt(k));
									}
								}
							}
							data.push(sb.join(''));
							lastX = parseFloat(data[0]) * xFactor - abscissaSpacing;
							for ( var k = 1, kk = data.length; k < kk; k++) {
								var decipher = data[k];
								// some of these arrays may return zero, so
								// check if undefined
								if (DUP_HASH[decipher.charAt(0)] !== undefined) {
									// be careful when reading this, to keep
									// spectra efficient, DUPS are actually
									// discarded, except the last y!
									var dup = parseInt(DUP_HASH[decipher.charAt(0)] + decipher.substring(1)) - 1;
									for ( var l = 0; l < dup; l++) {
										lastX += abscissaSpacing;
										lastDif = this.getValue(lastOrdinate, lastDif);
										lastY = lastDif * yFactor;
										count++;
										spectrum.data[spectrum.data.length - 1] = new structures.Point(lastX / observeFrequency, lastY);
									}
								} else {
									// some of these arrays may return zero, so
									// check if undefined
									if (!(SQZ_HASH[decipher.charAt(0)] !== undefined && lastWasDif)) {
										lastWasDif = DIF_HASH[decipher.charAt(0)] !== undefined;
										lastOrdinate = decipher;
										lastX += abscissaSpacing;
										lastDif = this.getValue(decipher, lastDif);
										lastY = lastDif * yFactor;
										count++;
										spectrum.data.push(new structures.Point(lastX / observeFrequency, lastY));
									} else {
										lastY = this.getValue(decipher, lastDif) * yFactor;
										if (isCompressedDiscontinuous) {
											lastX += abscissaSpacing;
											spectrum.data.push(new structures.Point(lastX / observeFrequency, lastY));
										}
									}
								}
							}
						}
						if (shiftOffsetNum !== -1) {
							var dif = shiftOffsetVal - spectrum.data[shiftOffsetNum - 1].x;
							for ( var i = 0, ii = spectrum.data.length; i < ii; i++) {
								spectrum.data[i].x += dif;
							}
						}
					} else if (extensions.stringStartsWith(currentRecord, '##PEAK TABLE=')) {
						recordMeta = false;
						spectrum.continuous = false;
						var innerLines = currentRecord.split('\n');
						var count = 0;
						var reg = /[\s,]+/;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(reg);
							count += items.length / 2;
							for ( var k = 0, kk = items.length; k + 1 < kk; k += 2) {
								spectrum.data.push(new structures.Point(parseFloat(items[k].trim()), parseFloat(items[k + 1].trim())));
							}
						}
					} else if (extensions.stringStartsWith(currentRecord, '##ATOMLIST=')) {
						spectrum.molecule = new structures.Molecule();
						var innerLines = currentRecord.split('\n');
						var reg = /[\s]+/;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(reg);
							spectrum.molecule.atoms.push(new structures.Atom(items[1]));
						}
					} else if (extensions.stringStartsWith(currentRecord, '##BONDLIST=')) {
						var innerLines = currentRecord.split('\n');
						var reg = /[\s]+/;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(reg);
							var order = 1;
							if(items[2]==='D'){
								order = 2;
							}else if(items[2]==='T'){
								order = 3;
							}
							spectrum.molecule.bonds.push(new structures.Bond(spectrum.molecule.atoms[parseInt(items[0])-1], spectrum.molecule.atoms[parseInt(items[1])-1], order));
						}
					} else if (spectrum.molecule && extensions.stringStartsWith(currentRecord, '##XY_RASTER=')) {
						var innerLines = currentRecord.split('\n');
						var reg = /[\s]+/;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(reg);
							var a = spectrum.molecule.atoms[parseInt(items[0])-1];
							a.x = parseInt(items[1]);
							a.y = parseInt(items[2]);
							if(items.length==4){
								a.z = parseInt(items[3]);
							}
						}
						spectrum.molecule.scaleToAverageBondLength(20);
					} else if (extensions.stringStartsWith(currentRecord, '##PEAK ASSIGNMENTS=')) {
						var innerLines = currentRecord.split('\n');
						var reg = /[\s,()<>]+/;
						spectrum.assignments = [];
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(reg);
							var x = parseFloat(items[1]);
							var y = parseFloat(items[2]);
							var a = spectrum.molecule.atoms[parseInt(items[3])-1];
							var used = false;
							for(var k = 0, kk = spectrum.assignments.length; k<kk; k++){
								var assign = spectrum.assignments[k];
								if(assign.x === x){
									assign.as.push(a);
									a.assigned = assign;
									used = true;
									break;
								}
							}
							if(!used){
								var assign = {x:x, y:y, as:[a]};
								a.assigned = assign;
								spectrum.assignments.push(assign);
							}
						}
					}
				}
			}
			spectrum.setup();
			return spectrum;
		};
		_.makeStructureSpectrumSet = function(id, content) {
			this.convertHZ2PPM = true;
			var spectrum = this.read(content);
			var mcanvas = new c.ViewerCanvas(id+'_molecule', 200,200);
			mcanvas.specs.atoms_displayTerminalCarbonLabels_2D = true;
			mcanvas.specs.atoms_displayImplicitHydrogens_2D = true;
			mcanvas.mouseout = function(e){
				if(this.molecules.length!==0){
					for(var i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
						this.molecules[0].atoms[i].isHover = false;
					}
					spectrum.hovered = undefined;
					this.repaint();
					scanvas.repaint();
				}
			};
			mcanvas.touchend = mcanvas.mouseout;
			mcanvas.mousemove = function(e){
				if(this.molecules.length!==0){
					var closest=undefined;
					for(var i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
						var a = this.molecules[0].atoms[i];
						a.isHover = false;
						if(a.assigned && (closest===undefined || e.p.distance(a)<e.p.distance(closest))){
							closest = a;
						}
					}
					spectrum.hovered = undefined;
					if(e.p.distance(closest)<20){
						for(var i = 0, ii = closest.assigned.as.length; i<ii; i++){
							closest.assigned.as[i].isHover = true;
						}
						scanvas.spectrum.hovered = closest.assigned;
					}
					this.repaint();
					scanvas.repaint();
				}
			};
			mcanvas.touchmove = mcanvas.mousemove;
			mcanvas.drawChildExtras = function(ctx){
				if(this.molecules.length!==0){
					for(var i = 0, ii = this.molecules[0].atoms.length; i<ii; i++){
						this.molecules[0].atoms[i].drawDecorations(ctx);
					}
				}
			};
			var scanvas = new c.ObserverCanvas(id+'_spectrum', 400,200);
			scanvas.specs.plots_showYAxis = false;
			scanvas.specs.plots_flipXAxis = true;
			scanvas.mouseout = function(e){
				if(this.spectrum && this.spectrum.assignments){
					for(var i = 0, ii = mcanvas.molecules[0].atoms.length; i<ii; i++){
						mcanvas.molecules[0].atoms[i].isHover = false;
					}
					this.spectrum.hovered = undefined;
					mcanvas.repaint();
					this.repaint();
				}
			};
			scanvas.touchend = scanvas.mouseout;
			scanvas.mousemove = function(e){
				if(this.spectrum && this.spectrum.assignments){
					var closest=undefined;
					for(var i = 0, ii = mcanvas.molecules[0].atoms.length; i<ii; i++){
						mcanvas.molecules[0].atoms[i].isHover = false;
					}
					this.spectrum.hovered = undefined;
					for(var i = 0, ii = this.spectrum.assignments.length; i<ii; i++){
						var a = this.spectrum.assignments[i];
						if(closest===undefined || Math.abs(this.spectrum.getTransformedX(a.x, this.specs, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)<Math.abs(this.spectrum.getTransformedX(closest.x, this.specs, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)){
							closest = a;
						}
					}
					if(Math.abs(this.spectrum.getTransformedX(closest.x, this.specs, this.spectrum.memory.width, this.spectrum.memory.offsetLeft)-e.p.x)<20){
						for(var i = 0, ii = closest.as.length; i<ii; i++){
							closest.as[i].isHover = true;
						}
						this.spectrum.hovered = closest;
					}
					mcanvas.repaint();
					this.repaint();
				}
			};
			scanvas.touchmove = scanvas.mousemove;
			scanvas.drawChildExtras = function(ctx){
				if(this.spectrum && this.spectrum.hovered){
					var x = this.spectrum.getTransformedX(this.spectrum.hovered.x, scanvas.specs, this.spectrum.memory.width, this.spectrum.memory.offsetLeft);
					if (x >= this.spectrum.memory.offsetLeft && x < this.spectrum.memory.width) {
						ctx.save();
						ctx.strokeStyle='#885110';
						ctx.lineWidth = 3;
						ctx.beginPath();
						ctx.moveTo(x, this.spectrum.memory.height - this.spectrum.memory.offsetBottom);
						ctx.lineTo(x, this.spectrum.getTransformedY(this.spectrum.hovered.y, scanvas.specs, this.spectrum.memory.height, this.spectrum.memory.offsetBottom, this.spectrum.memory.offsetTop));
						ctx.stroke();
						ctx.restore();
					}
				}
			};
			if(spectrum){
				scanvas.loadSpectrum(spectrum);
				if(spectrum.molecule){
					mcanvas.loadMolecule(spectrum.molecule);
				}
			}
			return [mcanvas, scanvas];
		};

		// shortcuts
		var interpreter = new io.JCAMPInterpreter();
		interpreter.convertHZ2PPM = true;
		c.readJCAMP = function(content) {
			return interpreter.read(content);
		};
	})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.lib.jQuery);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//
	(function(c, io, structures, d2, d3, JSON) {
		'use strict';
		io.JSONInterpreter = function() {
		};
		var _ = io.JSONInterpreter.prototype;
		_.contentTo = function(mols, shapes) {
			var count1 = 0, count2 = 0;
			for ( var i = 0, ii = mols.length; i < ii; i++) {
				var mol = mols[i];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					mol.atoms[j].tmpid = 'a' + count1++;
				}
				for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
					mol.bonds[j].tmpid = 'b' + count2++;
				}
			}
			count1 = 0;
			for ( var i = 0, ii = shapes.length; i < ii; i++) {
				shapes[i].tmpid = 's' + count1++;
			}
			var dummy = {};
			if (mols && mols.length > 0) {
				dummy.m = [];
				for ( var i = 0, ii = mols.length; i < ii; i++) {
					dummy.m.push(this.molTo(mols[i]));
				}
			}
			if (shapes && shapes.length > 0) {
				dummy.s = [];
				for ( var i = 0, ii = shapes.length; i < ii; i++) {
					dummy.s.push(this.shapeTo(shapes[i]));
				}
			}
			for ( var i = 0, ii = mols.length; i < ii; i++) {
				var mol = mols[i];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					mol.atoms[j].tmpid = undefined;
				}
				for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
					mol.bonds[j].tmpid = undefined;
				}
			}
			for ( var i = 0, ii = shapes.length; i < ii; i++) {
				shapes[i].tmpid = undefined;
			}
			return dummy;
		};
		_.contentFrom = function(dummy) {
			var obj = {
				molecules : [],
				shapes : []
			};
			if (dummy.m) {
				for ( var i = 0, ii = dummy.m.length; i < ii; i++) {
					obj.molecules.push(this.molFrom(dummy.m[i]));
				}
			}
			if (dummy.s) {
				for ( var i = 0, ii = dummy.s.length; i < ii; i++) {
					obj.shapes.push(this.shapeFrom(dummy.s[i], obj.molecules));
				}
			}
			for ( var i = 0, ii = obj.molecules.length; i < ii; i++) {
				var mol = obj.molecules[i];
				for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
					mol.atoms[j].tmpid = undefined;
				}
				for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
					mol.bonds[j].tmpid = undefined;
				}
			}
			for ( var i = 0, ii = obj.shapes.length; i < ii; i++) {
				obj.shapes[i].tmpid = undefined;
			}
			return obj;
		};
		_.queryTo = function(query) {
			var q = {};
			var appendProperty = function(q, p, name, isRange){
				if(p){
					q[name] = {v:isRange?query.outputRange(p.v):p.v, n:p.not};
				}
			};
			if(query.type===structures.Query.TYPE_ATOM){
				appendProperty(q, query.elements, 'as');
				appendProperty(q, query.chirality, '@');
				appendProperty(q, query.aromatic, 'A');
				appendProperty(q, query.charge, 'C', true);
				appendProperty(q, query.hydrogens, 'H', true);
				appendProperty(q, query.ringCount, 'R', true);
				appendProperty(q, query.saturation, 'S');
				appendProperty(q, query.connectivity, 'X', true);
				appendProperty(q, query.connectivityNoH, 'x', true);
			}else{
				appendProperty(q, query.orders, 'bs');
				appendProperty(q, query.stereo, '@');
				appendProperty(q, query.aromatic, 'A');
				appendProperty(q, query.ringCount, 'R', true);
			}
			return q;
		};
		_.molTo = function(mol) {
			var dummy = {
				a : []
			};
			for ( var i = 0, ii = mol.atoms.length; i < ii; i++) {
				var a = mol.atoms[i];
				var da = {
					x : a.x,
					y : a.y
				};
				if (a.tmpid) {
					da.i = a.tmpid;
				}
				if (a.label !== 'C') {
					da.l = a.label;
				}
				if (a.z !== 0) {
					da.z = a.z;
				}
				if (a.charge !== 0) {
					da.c = a.charge;
				}
				if (a.mass !== -1) {
					da.m = a.mass;
				}
				if (a.numRadical !== 0) {
					da.r = a.numRadical;
				}
				if (a.numLonePair !== 0) {
					da.p = a.numLonePair;
				}
				if (a.query) {
					da.q = this.queryTo(a.query);
				}
				dummy.a.push(da);
			}
			if (mol.bonds.length > 0) {
				dummy.b = [];
				for ( var i = 0, ii = mol.bonds.length; i < ii; i++) {
					var b = mol.bonds[i];
					var db = {
						b : mol.atoms.indexOf(b.a1),
						e : mol.atoms.indexOf(b.a2)
					};
					if (b.tmpid) {
						db.i = b.tmpid;
					}
					if (b.bondOrder !== 1) {
						db.o = b.bondOrder;
					}
					if (b.stereo !== structures.Bond.STEREO_NONE) {
						db.s = b.stereo;
					}
					if (b.query) {
						db.q = this.queryTo(b.query);
					}
					dummy.b.push(db);
				}
			}
			return dummy;
		};
		_.queryFrom = function(json) {
			var query = new structures.Query(json.as?structures.Query.TYPE_ATOM:structures.Query.TYPE_BOND);
			var setupProperty = function(query, json, name, isRange){
				if(json){
					query[name] = {};
					query[name].v = isRange?query.parseRange(json.v):json.v;
					if(json.n){
						query[name].not = true;
					}
				}
			};
			if(query.type===structures.Query.TYPE_ATOM){
				setupProperty(query, json.as, 'elements');
				setupProperty(query, json['@'], 'chirality');
				setupProperty(query, json.A, 'aromatic');
				setupProperty(query, json.C, 'charge', true);
				setupProperty(query, json.H, 'hydrogens', true);
				setupProperty(query, json.R, 'ringCount', true);
				setupProperty(query, json.S, 'saturation');
				setupProperty(query, json.X, 'connectivity', true);
				setupProperty(query, json.x, 'connectivityNoH', true);
			}else{
				setupProperty(query, json.bs, 'orders');
				setupProperty(query, json['@'], 'stereo');
				setupProperty(query, json.A, 'aromatic');
				setupProperty(query, json.R, 'ringCount', true);
			}
			return query;
		};
		_.molFrom = function(json) {
			var molecule = new structures.Molecule();
			for ( var i = 0, ii = json.a.length; i < ii; i++) {
				var c = json.a[i];
				var a = new structures.Atom(c.l ? c.l : 'C', c.x, c.y);
				if (c.i) {
					a.tmpid = c.i;
				}
				if (c.z) {
					a.z = c.z;
				}
				if (c.c) {
					a.charge = c.c;
				}
				if (c.m) {
					a.mass = c.m;
				}
				if (c.r) {
					a.numRadical = c.r;
				}
				if (c.p) {
					a.numLonePair = c.p;
				}
				if(c.q){
					a.query = this.queryFrom(c.q);
				}
				// these are booleans or numbers, so check if undefined
				if (c.p_h !== undefined) {
					a.hetatm = c.p_h;
				}
				if (c.p_w !== undefined) {
					a.isWater = c.p_w;
				}
				if (c.p_d !== undefined) {
					a.closestDistance = c.p_d;
				}
				molecule.atoms.push(a);
			}
			if (json.b) {
				for ( var i = 0, ii = json.b.length; i < ii; i++) {
					var c = json.b[i];
					// order can be 0, so check against undefined
					var b = new structures.Bond(molecule.atoms[c.b], molecule.atoms[c.e], c.o === undefined ? 1 : c.o);
					if (c.i) {
						b.tmpid = c.i;
					}
					if (c.s) {
						b.stereo = c.s;
					}
					if(c.q){
						b.query = this.queryFrom(c.q);
					}
					molecule.bonds.push(b);
				}
			}
			return molecule;
		};
		_.shapeTo = function(shape) {
			var dummy = {};
			if (shape.tmpid) {
				dummy.i = shape.tmpid;
			}
			if (shape instanceof d2.Line) {
				dummy.t = 'Line';
				dummy.x1 = shape.p1.x;
				dummy.y1 = shape.p1.y;
				dummy.x2 = shape.p2.x;
				dummy.y2 = shape.p2.y;
				dummy.a = shape.arrowType;
			} else if (shape instanceof d2.Pusher) {
				dummy.t = 'Pusher';
				dummy.o1 = shape.o1.tmpid;
				dummy.o2 = shape.o2.tmpid;
				if (shape.numElectron !== 1) {
					dummy.e = shape.numElectron;
				}
			} else if (shape instanceof d2.Bracket) {
				dummy.t = 'Bracket';
				dummy.x1 = shape.p1.x;
				dummy.y1 = shape.p1.y;
				dummy.x2 = shape.p2.x;
				dummy.y2 = shape.p2.y;
				if (shape.charge !== 0) {
					dummy.c = shape.charge;
				}
				if (shape.mult !== 0) {
					dummy.m = shape.mult;
				}
				if (shape.repeat !== 0) {
					dummy.r = shape.repeat;
				}
			} else if (shape instanceof d3.Distance) {
				dummy.t = 'Distance';
				dummy.a1 = shape.a1.tmpid;
				dummy.a2 = shape.a2.tmpid;
				if (shape.node) {
					dummy.n = shape.node;
					dummy.o = shape.offset;
				}
			} else if (shape instanceof d3.Angle) {
				dummy.t = 'Angle';
				dummy.a1 = shape.a1.tmpid;
				dummy.a2 = shape.a2.tmpid;
				dummy.a3 = shape.a3.tmpid;
			} else if (shape instanceof d3.Torsion) {
				dummy.t = 'Torsion';
				dummy.a1 = shape.a1.tmpid;
				dummy.a2 = shape.a2.tmpid;
				dummy.a3 = shape.a3.tmpid;
				dummy.a4 = shape.a4.tmpid;
			} else if (shape instanceof d3.UnitCell) {
				dummy.t = 'UnitCell';
				for (var p in shape.unitCell) {
			        dummy[p] = shape.unitCell[p];
			    }
			}
			return dummy;
		};
		_.shapeFrom = function(dummy, mols) {
			var shape;
			if (dummy.t === 'Line') {
				shape = new d2.Line(new structures.Point(dummy.x1, dummy.y1), new structures.Point(dummy.x2, dummy.y2));
				shape.arrowType = dummy.a;
			} else if (dummy.t === 'Pusher') {
				var o1, o2;
				for ( var i = 0, ii = mols.length; i < ii; i++) {
					var mol = mols[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (a.tmpid === dummy.o1) {
							o1 = a;
						} else if (a.tmpid === dummy.o2) {
							o2 = a;
						}
					}
					for ( var j = 0, jj = mol.bonds.length; j < jj; j++) {
						var b = mol.bonds[j];
						if (b.tmpid === dummy.o1) {
							o1 = b;
						} else if (b.tmpid === dummy.o2) {
							o2 = b;
						}
					}
				}
				shape = new d2.Pusher(o1, o2);
				if (dummy.e) {
					shape.numElectron = dummy.e;
				}
			} else if (dummy.t === 'Bracket') {
				shape = new d2.Bracket(new structures.Point(dummy.x1, dummy.y1), new structures.Point(dummy.x2, dummy.y2));
				if (dummy.c !== undefined) {
					// have to check against undefined as it is an integer that can
					// be 0
					shape.charge = dummy.c;
				}
				if (dummy.m !== undefined) {
					// have to check against undefined as it is an integer that can
					// be 0
					shape.mult = dummy.m;
				}
				if (dummy.r !== undefined) {
					// have to check against undefined as it is an integer that can
					// be 0
					shape.repeat = dummy.r;
				}
			} else if (dummy.t === 'Distance') {
				var a1, a2;
				for ( var i = 0, ii = mols.length; i < ii; i++) {
					var mol = mols[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (a.tmpid === dummy.a1) {
							a1 = a;
						} else if (a.tmpid === dummy.a2) {
							a2 = a;
						}
					}
				}
				shape = new d3.Distance(a1, a2, dummy.n, dummy.o);
			} else if (dummy.t === 'Angle') {
				var a1, a2, a3;
				for ( var i = 0, ii = mols.length; i < ii; i++) {
					var mol = mols[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (a.tmpid === dummy.a1) {
							a1 = a;
						} else if (a.tmpid === dummy.a2) {
							a2 = a;
						} else if (a.tmpid === dummy.a3) {
							a3 = a;
						}
					}
				}
				shape = new d3.Angle(a1, a2, a3);
			} else if (dummy.t === 'Torsion') {
				var a1, a2, a3, a4;
				for ( var i = 0, ii = mols.length; i < ii; i++) {
					var mol = mols[i];
					for ( var j = 0, jj = mol.atoms.length; j < jj; j++) {
						var a = mol.atoms[j];
						if (a.tmpid === dummy.a1) {
							a1 = a;
						} else if (a.tmpid === dummy.a2) {
							a2 = a;
						} else if (a.tmpid === dummy.a3) {
							a3 = a;
						} else if (a.tmpid === dummy.a4) {
							a4 = a;
						}
					}
				}
				shape = new d3.Torsion(a1, a2, a3, a4);
			} else if (dummy.t === 'UnitCell') {
				var unitCellVectors = {};
				for (var p in dummy) {
					unitCellVectors[p] = dummy[p];
			    }
				shape = new d3.UnitCell(unitCellVectors);
			}
			return shape;
		};
		_.pdbFrom = function(content) {
			var mol = this.molFrom(content.mol);
			mol.findRings = false;
			// mark from JSON to note to algorithms that atoms in chain are not
			// same
			// objects as in atom array
			mol.fromJSON = true;
			mol.chains = this.chainsFrom(content.ribbons);
			return mol;
		};
		_.chainsFrom = function(content) {
			var chains = [];
			for ( var i = 0, ii = content.cs.length; i < ii; i++) {
				var chain = content.cs[i];
				var c = [];
				for ( var j = 0, jj = chain.length; j < jj; j++) {
					var convert = chain[j];
					var r = new structures.Residue();
					r.name = convert.n;
					r.cp1 = new structures.Atom('', convert.x1, convert.y1, convert.z1);
					r.cp2 = new structures.Atom('', convert.x2, convert.y2, convert.z2);
					if (convert.x3) {
						r.cp3 = new structures.Atom('', convert.x3, convert.y3, convert.z3);
						r.cp4 = new structures.Atom('', convert.x4, convert.y4, convert.z4);
						r.cp5 = new structures.Atom('', convert.x5, convert.y5, convert.z5);
					}
					r.helix = convert.h;
					r.sheet = convert.s;
					r.arrow = j > 0 && chain[j - 1].a;
					c.push(r);
				}
				chains.push(c);
			}
			return chains;
		};

		// shortcuts
		var interpreter = new io.JSONInterpreter();
		c.readJSON = function(string) {
			var obj;
			try {
				obj = JSON.parse(string);
			} catch (e) {
				// not json
				return undefined;
			}
			if (obj) {
				if (obj.m || obj.s) {
					return interpreter.contentFrom(obj);
				} else if (obj.a) {
					return obj = {
						molecules : [ interpreter.molFrom(obj) ],
						shapes : []
					};
				} else {
					return obj = {
						molecules : [],
						shapes : []
					};
				}
			}
			return undefined;
		};
		c.writeJSON = function(mols, shapes) {
			return JSON.stringify(interpreter.contentTo(mols, shapes));
		};

	})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.structures.d2, ChemDoodle.structures.d3, JSON);
	//
	// Copyright 2009-2015 iChemLabs, LLC. All rights reserved.
	//
	(function(c, io, structures) {
		'use strict';
		io.RXNInterpreter = function() {
		};
		var _ = io.RXNInterpreter.prototype = new io._Interpreter();
		_.read = function(content, multiplier) {
			if (!multiplier) {
				multiplier = c.default_bondLength_2D;
			}
			var molecules = [];
			var line;
			if (!content) {
				molecules.push(new structures.Molecule());
				line = new structures.d2.Line(new structures.Point(-20, 0), new structures.Point(20, 0));
			} else {
				var contentTokens = content.split('$MOL\n');
				var headerTokens = contentTokens[0].split('\n');
				var counts = headerTokens[4];
				var numReactants = parseInt(counts.substring(0, 3));
				var numProducts = parseInt(counts.substring(3, 6));
				var currentMolecule = 1;
				var start = 0;
				for ( var i = 0, ii = numReactants + numProducts; i < ii; i++) {
					molecules[i] = c.readMOL(contentTokens[currentMolecule], multiplier);
					var b = molecules[i].getBounds();
					var width = b.maxX - b.minX;
					start -= width + 40;
					currentMolecule++;
				}
				for ( var i = 0, ii = numReactants; i < ii; i++) {
					var b = molecules[i].getBounds();
					var width = b.maxX - b.minX;
					var center = molecules[i].getCenter();
					for ( var j = 0, jj = molecules[i].atoms.length; j < jj; j++) {
						var a = molecules[i].atoms[j];
						a.x += start + (width / 2) - center.x;
						a.y -= center.y;
					}
					start += width + 40;
				}
				line = new structures.d2.Line(new structures.Point(start, 0), new structures.Point(start + 40, 0));
				start += 80;
				for ( var i = numReactants, ii = numReactants + numProducts; i < ii; i++) {
					var b = molecules[i].getBounds();
					var width = b.maxX - b.minX;
					var center = molecules[i].getCenter();
					for ( var j = 0; j < molecules[i].atoms.length; j++) {
						var a = molecules[i].atoms[j];
						a.x += start + (width / 2) - center.x;
						a.y -= center.y;
					}
					start += width + 40;
				}
			}
			line.arrowType = structures.d2.Line.ARROW_SYNTHETIC;
			return {
				'molecules' : molecules,
				'shapes' : [ line ]
			};
		};
		_.write = function(mols, shapes) {
			var molecules = [ [], [] ];
			var ps = undefined;
			if (!mols || !shapes) {
				return;
			}
			for (i = 0, ii = shapes.length; i < ii; i++) {
				if (shapes[i] instanceof structures.d2.Line) {
					ps = shapes[i].getPoints();
					break;
				}
			}
			if (!ps) {
				return '';
			}
			for ( var i = 0, ii = mols.length; i < ii; i++) {
				var center = mols[i].getCenter();
				if (center.x < ps[1].x) {
					molecules[0].push(mols[i]);
				} else {
					molecules[1].push(mols[i]);
				}
			}
			var sb = [];
			sb.push('$RXN\nReaction from ChemDoodle Web Components\n\nhttp://www.ichemlabs.com\n');
			sb.push(this.fit(molecules[0].length.toString(), 3));
			sb.push(this.fit(molecules[1].length.toString(), 3));
			sb.push('\n');
			for ( var i = 0; i < 2; i++) {
				for ( var j = 0, jj = molecules[i].length; j < jj; j++) {
					sb.push('$MOL\n');
					sb.push(c.writeMOL(molecules[i][j]));
					sb.push('\n');
				}
			}
			return sb.join('');
		};

		// shortcuts
		var interpreter = new io.RXNInterpreter();
		c.readRXN = function(content, multiplier) {
			return interpreter.read(content, multiplier);
		};
		c.writeRXN = function(mols, shapes) {
			return interpreter.write(mols, shapes);
		};

	})(ChemDoodle, ChemDoodle.io, ChemDoodle.structures);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(c, ELEMENT, SYMBOLS, io, structures, trim) {
		'use strict';
		io.XYZInterpreter = function() {
		};
		var _ = io.XYZInterpreter.prototype = new io._Interpreter();
		_.deduceCovalentBonds = true;
		_.read = function(content) {
			var molecule = new structures.Molecule();
			if (!content) {
				return molecule;
			}
			var lines = content.split('\n');

			var numAtoms = parseInt(trim(lines[0]));

			for ( var i = 0; i < numAtoms; i++) {
				var line = lines[i + 2];
				var tokens = line.split(/\s+/g);
				molecule.atoms[i] = new structures.Atom(isNaN(tokens[0]) ? tokens[0] : SYMBOLS[parseInt(tokens[0]) - 1], parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
			}
			if (this.deduceCovalentBonds) {
				new c.informatics.BondDeducer().deduceCovalentBonds(molecule, 1);
			}
			return molecule;
		};

		// shortcuts
		var interpreter = new io.XYZInterpreter();
		c.readXYZ = function(content) {
			return interpreter.read(content);
		};

	})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.SYMBOLS, ChemDoodle.io, ChemDoodle.structures, ChemDoodle.lib.jQuery.trim);

	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(io, document, window) {
		'use strict';
		io.png = {};

		io.png.create = function(canvas) {
			// this will not work for WebGL canvases in some browsers
			// to fix that you need to set the "preserveDrawingBuffer" to true when
			// creating the WebGL context
			// note that this will cause performance issues on some platforms and is
			// therefore not done by default
			window.open(document.getElementById(canvas.id).toDataURL('image/png'));
		};

	})(ChemDoodle.io, document, window);
	//
	//  Copyright 2009 iChemLabs, LLC.  All rights reserved.
	//

	(function(io, q) {
		'use strict';
		io.file = {};

		// this function will only work with files from the same origin it is being
		// called from, unless the receiving server supports XHR2
		io.file.content = function(url, callback) {
			q.get(url, '', callback);
		};

	})(ChemDoodle.io, ChemDoodle.lib.jQuery);

};