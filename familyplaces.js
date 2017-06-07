// Variables globales
var map; //div google maps
var log; //fichier log
var fileInput = document.getElementById('file'); //input file
var forFile = document.querySelector('.forfile');
var logElt = document.getElementById('retour');
var inputElts = document.querySelectorAll('input,select');
var comp = []; //compilation des personnes
var lignes = [];
var places = [];
var markers = [];
//encodage des caractères d'après tamurajones.net
var charset = {
	'ASCII': 'ascii',
	'UTF-8': 'UTF-8',
	'UNICODE': 'UTF-16',
	'ANSEL': 'windows-1252',
	'ANSI': 'windows-1252',
	'WINDOWS': 'windows-1252',
	'IBM WINDOWS': 'windows-1252',
	'IBM_WINDOWS': 'windows-1252',
	'CP1252': 'cp1252',
	'windows-1250': 'cp1250',
	'WINDOWS-1251': 'cp1251',
	'ISO-8859-1': 'ISO-8859-1',
	'ISO8859-1': 'ISO-8859-1',
	'ISO8859': 'ISO-8859-1',
	'LATIN1': 'ISO-8859-1',
	'MACINTOSH': 'mac',
	'IBMPC': 'cp437',
	'IBM-PC': 'cp437',
	'OEM': 'cp437',
	'MSDOS': 'cp850',
	'MS-DOS': 'cp850',
	'IBM DOS': 'cp850'
};
var evenementsLies = {
	'BIRT': 'CHR',
	'DEAT': 'BURI'
};

// JQRangeSlider 
var currentDate = new Date();
$("#slider").editRangeSlider({
	bounds: {
		min: 0,
		max: currentDate.getFullYear()
	},
	defaultValues: {
		min: 0,
		max: currentDate.getFullYear()
	},
	step: 1,
	type: 'number'
});

//ajout d'une méthode à array.prototype
Array.prototype.prop = function(p) {
	return this.map(function(e) {
		return e[p];
	})
}

//gérer le pop-up
function popup(afficher) {
	var loadingElt = document.getElementById('loading');
	if (afficher) {
		loadingElt.style.display = 'block';
	} else {
		loadingElt.style.display = 'none';
	}
}

function popMsg(messageHtml) {
	document.getElementById('msg').innerHTML = messageHtml;
}

//routine pour corriger les accents dans les fichiers codés en ANSEL
function decodeAnsel(str) {
	var utf = ['Š', 'Œ', 'š', 'œ', 'Ÿ', '¡', '¢', '£', '¤', '©', '®', '°', '±', '·', '¿', 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', 'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß', 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ', 'ÿ'];
	var ansel = ['æS', '¦', 'æs', '¶', 'èY', 'Æ', 'Ø', '¹', 'Þ', 'Ã', 'ª', 'À', '«', '¨', 'Å', 'áA', 'âA', 'ãA', 'äA', 'èA', 'êA', '¥', 'ðC', 'áE', 'âE', 'ãE', 'èE', 'áI', 'âI', 'ãI', 'èI', '£', 'äN', 'áO', 'âO', 'ãO', 'äO', 'èO', '¢', 'áU', 'âU', 'ãU', 'èU', 'âY', '¤', 'Ï', 'áa', 'âa', 'ãa', 'äa', 'èa', 'êa', 'µ', 'ðc', 'áe', 'âe', 'ãe', 'èe', 'ái', 'âi', 'ãi', 'èi', 'º', 'än', 'áo', 'âo', 'ão', 'äo', 'èo', '²', 'áu', 'âu', 'ãu', 'èu', 'ây', '´', 'èy'];
	var ret = str;
	utf.forEach(function(e, i) {
		let regex = new RegExp(ansel[i], 'g');
		ret = ret.replace(regex, e);
	});
	return ret;
}
//algo gedtojson de J. Klocker licence GNU General Public License version 2.0 (GPLv2)
function gedcom(fichier) {
	var lines = fichier.replace(/\r/g, '').split('\n');
	var files = '';
	var ind = 0;
	var firstIndi = null;

	var assignGED = function(level) { // returns an object with all the objects of the given level
		// global lines, ind, firstIndi
		var ret, gedkey, gedcont, keyIndex, line, parts, subobjects;
		gedkey = '';
		keyIndex = new Object(); // last index of a key      
		while (true) {
			if (ind >= lines.length) return ret;
			line = lines[ind];
			parts = line.match(/(\d+)[ ]+([A-Za-z0-9@_]+)\s*(.*)/);
			if (parts) {
				if ((parts[1] - 0) < level) return ret;
				if (parts[1] > level) {
					ajouteLog('Level ' + level + 'expected at line ' + (ind + 1) + '; line=' + line, true);
					return false;
				}
				if ((parts[2].substr(0, 4) == 'CONC') && (gedkey == '')) parts[2] = 'CONT';
				if (parts[2].substr(0, 4) == 'FILE') files += 'copy "' + parts[3] + '" .' + "\n";
				if (parts[2].substr(0, 4) == 'CONC') {
					if (!ret) ret = new Object;
					if (typeof(keyIndex[gedkey]) == 'undefined') {
						keyIndex[gedkey] = 0;
						ret[gedkey + '.' + keyIndex[gedkey]] += parts[3];
					} else ret[gedkey + '.' + keyIndex[gedkey]] += parts[3]; // append to the last gedcont
					ind++;
				} else {
					gedkey = parts[2];
					if (gedkey.substr(0, 1) != '@') gedkey = gedkey.substr(0, 4);
					gedcont = false;
					if (parts[3] != '') gedcont = parts[3];
					if ((!firstIndi) && (gedcont == 'INDI') && (gedkey.substr(0, 1) == '@')) firstIndi = gedkey;
					ind++;
					subobjects = assignGED(level + 1);
					if ((gedcont !== false) || subobjects) {
						if (typeof(keyIndex[gedkey]) == 'undefined') keyIndex[gedkey] = 0;
						else keyIndex[gedkey]++;
						if (!ret) ret = new Object;
						if (gedcont !== false) ret[gedkey + '.' + keyIndex[gedkey]] = gedcont;
						if (subobjects) ret[gedkey + '.' + keyIndex[gedkey] + '.'] = subobjects;
					}
				}
			} else ind++;
		}
	}
	return assignGED(0);
}

//récupération des données
function nom(indiv) {
	var str = indiv['NAME.0'];
	var array = /\/(.*?)\//g.exec(str);
	if (array != null) {
		return array[1];
	}
	return '';
}

function prenoms(indiv) {
	var array = indiv['NAME.0'].split('\/');
	if (array != null) {
		return array[0].trim();
	}
	return '';
}

function sex(indiv) {
	return indiv['SEX.0'];
}

function date(obj, type) {
	var ev = obj[type + '.0.'];
	if (ev) {
		var array = /([0-9]+)$/g.exec(obj[type + '.0.']['DATE.0']);
		if (array != null) {
			return parseInt(array[0]);
		}
	}
	return null;
}

function ident(str) {
	var array = str.split('@');
	return array[1];
}

function lieu(obj, type) {
	var ev = obj[type + '.0.'];
	if (ev) {
		var ret = ev['PLAC.0'];
		if (ret) {
			return ret;
		}
	}
	return null;
}

// panneau coulissant
function fermePanneau() {
	document.getElementById('panneau').style.right = '-260px';
	setTimeout(function() {document.getElementById('retpan').style.display = 'block'}, 1000);
}

function ouvrePanneau(e) {
	document.getElementById('panneau').style.right = '0';
	document.getElementById('retpan').style.display = 'none';
}

document.getElementById('croix').addEventListener('click', fermePanneau	);
document.getElementById('retpan').addEventListener('click', ouvrePanneau);

// gestion du log
function createLog() {
	document.getElementById('retour').style.display = 'block';
	log = {
		text: '',
		errors: 0,
		req: 0
	}
	logElt.innerHTML = '';
	pelt = document.createElement('p');
	xmpElt = document.createElement('xmp');
	aElt = document.createElement('a');
	aElt.textContent = 'Fermer';
	aElt.href = '';
	logElt.appendChild(pelt);
	afficheLog();
}

function afficheLog() {

	pelt.innerHTML = log.errors + ' erreurs. <a href="" id="toglog">Consulter le log</a>';
	xmpElt.innerHTML = log.text;
	document.getElementById('toglog').addEventListener('click', function(e) {
		e.preventDefault();
		msg.innerHTML = '';
		msg.appendChild(xmpElt);
		msg.appendChild(aElt);
		document.querySelector('xmp + a').addEventListener('click', function(f) {
			f.preventDefault();
			popup(false);
		});
		popup(true);
	})
}

function ajouteLog(str, error) {
	if (error) {
		log.errors++;
	}
	log.text += str + '\n';
	afficheLog();
}


//infobulles
function textBulle(pers) {
	return '<section class="personne ' + pers.sex + '"><h3>' + pers.lastname.toUpperCase() + ' ' + pers.firstnames + '</h3><span>' + pers.date + '</span><span>N°' + pers.id + '</span></section>';
};

//création des marqueurs
function createMarkers(min, max) {
	markerCluster.clearMarkers();
	var precInfoBulle = false;
	var bounds = new google.maps.LatLngBounds();
	markers = [];
	comp.forEach(function(e) {
		arr = e.bulle.filter(function(el) {
			if (el.segment) {
			el.segment.setMap(null);
		}
			return ((el.date >= min) && (el.date <= max));
		}).sort(function(a, b) {
			if (a.date < b.date) {
				return -1;
			}
			if (a.date > b.date) {
				return 1;
			}
			return 0;
		});
		if (arr.length != 0) {
			var tit = arr[0].name;
			if (arr.length > 1) {
				tit += ', ...';
			}
			arr.forEach(function(el) {
				if (el.segment) {
				el.segment.setMap(map);
			}
			})
			var marker = new google.maps.Marker({
				position: e.location,
				title: tit,
				//map: map,
				label: arr.length.toString(),
				numb: arr.length
			});
			markers.push(marker);
			var infoBulle = new google.maps.InfoWindow({
				content: '<h4 class="lieu">' + e.place + '</h4>' + arr.prop('text').join('')
			});
			marker.addListener('click', function() {
				if (precInfoBulle) {
					precInfoBulle.close();
				}
				precInfoBulle = infoBulle;
				infoBulle.open(map, marker);
			})
			markers.push(marker);
			bounds.extend(e.location);
		}
	});

	markerCluster.addMarkers(markers); //markerclusterer, licence Apache 2.0

	if (markers.length > 0) {
		map.fitBounds(bounds);
	}

}

function creerSegment(persons, id, loc, sex) {
	if (id) {
		var lineSymbol = {
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
		};
		var c = persons.findIndex(function(pers) {
			return (pers.id === id)
		});
		var l = places[persons[c].place];
		var color;
		if (sex === 'M') {
			color = '#4483f7';
		} else {
			if (sex === 'F') {
				color = '#e2427c';
			} else {
				color = '#bbbdbf';
			}
		}
		if ((l !== 'dnf') && (l !== loc)) {
			var flightPath = new google.maps.Polyline({
				path: [loc, l],
				geodesic: true,
				strokeColor: color,
				icons: [{
					icon: lineSymbol,
					offset: '90%'
				}],
				strokeOpacity: 1,
				strokeWeight: 2
			});
			return flightPath;
		}
	}
	return null;
}

function affSegments() {

}

function supprSegments() {
	comp.forEach(function(el) {
		el.bulle.forEach(function(elt) {
			if (elt.segment) {
				elt.segment.setMap(null);
			}
		});
	})
}

//requêtes à l'api google et compilation des données
function localise(lieu, retard) {
	return new Promise(function(resolve, reject) {
		if (places[lieu]) {
			resolve(places[lieu]);
		} else {
			setTimeout(ajaxGet, retard * 1000, "https://maps.googleapis.com/maps/api/geocode/json?address=" + lieu + "&key=AIzaSyAx7_ttohnH2MZnOFilss0gC3tE9KP7pTc", function(reponse) {
				popMsg('<p>Localisation en cours<br />' + lieu + '</p>');
				var geocode = JSON.parse(reponse);
				log.req++;
				if (geocode.status === 'OK') {
					var loc = geocode.results[0].geometry.location;
					places[lieu] = loc;
					resolve(loc);
				} else {
					if (geocode.status === 'OVER_QUERY_LIMIT') {
						if (geocode.error_message.includes('daily')) {
							ajouteLog('Quota dépassé', true);
							places[lieu] = 'dnf';
							resolve(null);
						} else {
							localise(lieu, 1.1).then(function(rep) {
								resolve(rep);
							})
						}
					} else {
						places[lieu] = 'dnf';
						resolve(null);
					}
				}

			})
		}
	})
}

//recupérer les bornes de la période concernée
function dateMax(persons) {
	return Math.max(...persons.prop('date'));
}

function dateMin(persons) {
	return Math.min(...persons.prop('date'));
}

function decrire(arbre, id, type, line) {
	var p = new Object();
	var indiv = arbre['@' + id + '@.0.'];
	p.firstnames = prenoms(indiv);
	p.lastname = nom(indiv);
	p.sex = sex(indiv);
	p.line = line;
	p.date = date(indiv, type);
	p.place = lieu(indiv, type);
	p.id = id;
	if (!(p.place && p.place)) {
		p.date = date(indiv, evenementsLies[type]);
		p.place = lieu(indiv, evenementsLies[type]);
	}
	return p;
}

function tout(arbre, type) {
	var ret = [];
	var tableau = Object.keys(arbre);
	tableau.forEach(function(e) {
		if (arbre[e] == 'INDI') {
			var p = decrire(arbre, ident(e), type, null);
			if (p.place && p.date) {
				ret.push(p);
			}
		}
	})
	return ret;
}

function ancetres(arbre, id, type, line) {
	var ret = [];
	var indiv = arbre['@' + id + '@.0.'];
	if (indiv) {
		var p = decrire(arbre, id, type, line);
		if (!(p.date && p.place)) {
			return [];
		}
		ret.push(p);
		var famc = indiv['FAMC.0'];
		if (famc) {
			var f = arbre[famc + '.0.'];
			var husb = f['HUSB.0'];
			var wife = f['WIFE.0'];
			if (husb) {
				ret = ret.concat(ancetres(arbre, ident(husb), type, id));
			}
			if (wife) {
				ret = ret.concat(ancetres(arbre, ident(wife), type, id));
			}
		}
	}
	return ret;
}


function parente(arbre, id, type) {
	function ancetresArray(arbre, id) {
		var rt = [id];
		var indiv = arbre['@' + id + '@.0.'];
		if (indiv) {
			var famc = indiv['FAMC.0'];
			if (famc) {
				var f = arbre[famc + '.0.'];
				var husb = f['HUSB.0'];
				var wife = f['WIFE.0'];
				if (husb) {
					rt = rt.concat(ancetresArray(arbre, ident(husb)));
				}
				if (wife) {
					rt = rt.concat(ancetresArray(arbre, ident(wife)));
				}
			}
		}
		return rt;
	}
	var ret = [];
	var tableau = Object.keys(arbre);
	tableau.forEach(function(e) {
		if (arbre[e] == 'INDI') {
			var a = ancetresArray(arbre, ident(e));
			var b = ancetresArray(arbre, id);	
			var inter = a.reduce(function (acc, val) {
				return acc || b.includes(val);
			}, false);
			if (inter) {
				var p = decrire(arbre, ident(e), type, null);
				if (p.place && p.date) {
					ret.push(p);
				}
			}
		}
	})
	return ret;
}

function choisir(arbre) {
	var liste = [];
	var tableau = Object.keys(arbre);
	tableau.forEach(function(e) {
		if (arbre[e] == 'INDI') {
			let indiv = arbre[e + '.'];
			liste.push({nom: nom(indiv) + ' ' + prenoms(indiv), ind: ident(e)});
		}
	})
	return liste;
}

//traiter l'arbre en fonction du mode
function traitement(arbre) {
	popup(true);
	popMsg('<p>Localisation en cours...</p>');
	supprSegments();
	comp = [];
	lignes = [];
	var evenement = document.querySelector('input[type=radio]:checked').value;
	var mode = document.querySelector('select').value;
	var person;
	switch (mode) {
		case "tout": persons = tout(arbre, evenement);
		break;
		case "parents": persons = parente(arbre, 'I1', evenement);
		break;
		case "ancetres": persons = ancetres(arbre, 'I1', evenement, null);
		break;
	}

	$("#slider").editRangeSlider("option", "bounds", {
		min: dateMin(persons),
		max: dateMax(persons)
	});
	$("#slider").editRangeSlider("values", dateMin(persons), dateMax(persons));

	log.req = 0;
	var lieux = [];
	persons.forEach(function(e) {
		var lieu = e.place;
		if (!lieux.includes(lieu)) {
			lieux.push(lieu);
		}
	})
	var promesses = [];
	lieux.forEach(function(e) {
		var voisins = persons.filter(function(pers) {
			return (pers.place === e);
		});
		promesses.push(localise(e, 0));

	})

	Promise.all(promesses).then(function(temp) {
		lieux.forEach(function(e) {
				var voisins = persons.filter(function(pers) {
					return (pers.place === e);
				});
				var loc = places[e];
				if (places[e] !== 'dnf') {
					var j = comp.findIndex(function(co) {
						return (JSON.stringify(co.location) === JSON.stringify(loc));
					});
					var bulle = voisins.map(function(pers) {
						return {
							text: textBulle(pers),
							date: pers.date,
							name: pers.lastname,
							segment: creerSegment(persons, pers.line, loc, pers.sex)
						};
					})
					if (j === -1) {
						comp.push({
							bulle: bulle,
							location: loc,
							place: e
						});

					} else {
						comp[j].bulle = comp[j].bulle.concat(bulle);
					}
				} else {
					ajouteLog('erreur lieu personnes n°' + voisins.prop('id').sort().join(', ') + ', lieu : ' + e, true);
				}
			})
			//		comp = comp.map
		var sum = comp.reduce(function(acc, e) {
			return acc + e.bulle.length;
		}, 0);
		ajouteLog(sum + ' personnes localisées\n' + log.req + '  requêtes geocode effectuées\n' + comp.length + ' marqueurs créés', false);
		fermePanneau();		
		createMarkers(dateMin(persons), dateMax(persons));
		popup(false);
	})


	$('#slider').bind('valuesChanged', function(e, data) {
		createMarkers(data.values.min, data.values.max);
	});
}

//initialisation, fonction appelée au chargement de la page
function initMap() {

	inputElts.forEach(function(e) {
		if (e.id !== 'file') {
			e.addEventListener('change', function() {
				if (arbre) {
					traitement(arbre);
				}
			});
		};
	});

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: {
			lat: 0,
			lng: 0
		}
	});

	var options = {
		gridSize: 45,
		zoomOnClick: true,
		averageCenter: true,
		styles: null,
		imagePath: 'images/m'
	};

	markerCluster = new MarkerClusterer(map, [], options);

	//traitement du fichier
	fileInput.addEventListener('change', function() {
		popup(true);
		popMsg(msg.innerHTML = '<p>Ouverture du fichier en cours...</p>');
		var s = this.files[0].name;
		if (s.trim() == '') {
			s = 'Envoyez votre Gedcom';
		}
		forFile.textContent = s;
		var reader = new FileReader();

		var char = 'ANSI';


		reader.addEventListener('load', function() {

			createLog();

			 arbre = gedcom(reader.result);
			if (!arbre) {
				ajouteLog('erreur : fichier non valide', true);
				popup(false);
				return;
			}

			//traitement de l'encodage de caractères
			var fileCharset = arbre['HEAD.0.']['CHAR.0'];
			if (fileCharset != char) {
				if (Object.keys(charset).includes(fileCharset)) {
					char = fileCharset;
					reader.readAsText(fileInput.files[0], charset[char]);
					return;
				} else {
					ajouteLog('erreur : encodage ' + fileCharset + ' non reconnu', true);
				}
			}
			if (fileCharset == 'ANSEL') {
				arbre = gedcom(decodeAnsel(reader.result));
			}
			traitement(arbre);
		});

		reader.readAsText(fileInput.files[0], charset[char]);
	});
}