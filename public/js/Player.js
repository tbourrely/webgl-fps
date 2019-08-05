Player = function(game, canvas) {
	var _this = this;

	this.weaponShoot = false;

	this.ghostPlayers = [];

	this.angularSensibility = 2000.0;

	this.speed = 1;

	this.game = game;

	// La scène du jeu
	this.scene = game.scene;

	this.previousWheeling = 0;

	window.addEventListener(
		"keyup",
		function(evt) {
			switch (evt.keyCode) {
				case 90:
					_this.camera.axisMovement[0] = false;
					break;
				case 83:
					_this.camera.axisMovement[1] = false;
					break;
				case 81:
					_this.camera.axisMovement[2] = false;
					break;
				case 68:
					_this.camera.axisMovement[3] = false;
					break;
			}

			var data = {
				axisMovement: _this.camera.axisMovement
			};
			_this.sendNewData(data);
		},
		false
	);

	// Quand les touches sont relachés
	window.addEventListener(
		"keydown",
		function(evt) {
			switch (evt.keyCode) {
				case 90:
					_this.camera.axisMovement[0] = true;
					break;
				case 83:
					_this.camera.axisMovement[1] = true;
					break;
				case 81:
					_this.camera.axisMovement[2] = true;
					break;
				case 68:
					_this.camera.axisMovement[3] = true;
					break;
			}

			var data = {
				axisMovement: _this.camera.axisMovement
			};
			_this.sendNewData(data);
		},
		false
	);

	window.addEventListener(
		"mousemove",
		function(evt) {
			if (_this.rotEngaged === true) {
				_this.camera.playerBox.rotation.y +=
					evt.movementX * (0.001 * (_this.angularSensibility / 250));
				var nextRotationX =
					_this.camera.playerBox.rotation.x +
					evt.movementY * (0.001 * (_this.angularSensibility / 250));
				if (
					nextRotationX < degToRad(90) &&
					nextRotationX > degToRad(-90)
				) {
					_this.camera.playerBox.rotation.x +=
						evt.movementY *
						(0.001 * (_this.angularSensibility / 250));
				}
			}

			var data = {
				rotation: _this.camera.playerBox.rotation
			};
			_this.sendNewData(data);
		},
		false
	);

	// Initialisation de la caméra
	this._initCamera(this.scene, canvas);

	// Le joueur doit cliquer dans la scène pour que controlEnabled soit changé
	this.controlEnabled = false;

	// On lance l'event _initPointerLock pour checker le clic dans la scène
	this._initPointerLock();
};

Player.prototype = {
	_initCamera: function(scene, canvas) {
		var random0to1 = Math.random();

		var randomInt = Math.round(
			random0to1 * (this.game.allSpawnPoints.length - 1)
		);

		this.spawnPoint = this.game.allSpawnPoints[randomInt].clone();

		var playerBox = BABYLON.Mesh.CreateBox("headMainPlayer", 3, scene);
		playerBox.position = this.spawnPoint;
		playerBox.ellipsoid = new BABYLON.Vector3(2, 2, 2);

		// On crée la caméra
		this.camera = new BABYLON.FreeCamera(
			"camera",
			new BABYLON.Vector3(0, 0, 0),
			scene
		);
		this.camera.playerBox = playerBox;
		this.camera.parent = this.camera.playerBox;

		this.camera.playerBox.checkCollisions = true;
		this.camera.playerBox.applyGravity = true;

		this.camera.isMain = true;

		// Axe de mouvement X et Z
		this.camera.axisMovement = [false, false, false, false];

		// Creation des armes
		this.camera.weapons = new Weapons(this);
		this.camera.health = 100;
		this.camera.armor = 0;

		// Si le joueur est en vie ou non
		this.isAlive = true;

		var hitBoxPlayer = BABYLON.Mesh.CreateBox("hitBoxPlayer", 3, scene);
		hitBoxPlayer.parent = this.camera.playerBox;
		hitBoxPlayer.scaling.y = 2;
		hitBoxPlayer.isPickable = true;
		hitBoxPlayer.isMain = true;

		this.game.scene.activeCamera = this.camera;
	},
	_initPointerLock: function() {
		var _this = this;

		// Requete pour la capture du pointeur
		var canvas = this.game.scene.getEngine().getRenderingCanvas();

		// On affecte le clic et on vérifie qu'il est bien utilisé dans la scène (_this.controlEnabled)
		canvas.addEventListener(
			"mousedown",
			function(evt) {
				if (_this.controlEnabled && !_this.weponShoot) {
					_this.weponShoot = true;
					_this.handleUserMouseDown();
				}
			},
			false
		);

		// On fait pareil quand l'utilisateur relache le clic de la souris
		canvas.addEventListener(
			"mouseup",
			function(evt) {
				if (_this.controlEnabled && _this.weponShoot) {
					_this.weponShoot = false;
					_this.handleUserMouseUp();
				}
			},
			false
		);

		canvas.addEventListener(
			"click",
			function(evt) {
				canvas.requestPointerLock =
					canvas.requestPointerLock ||
					canvas.msRequestPointerLock ||
					canvas.mozRequestPointerLock ||
					canvas.webkitRequestPointerLock;
				if (canvas.requestPointerLock) {
					canvas.requestPointerLock();
				}
			},
			false
		);

		canvas.addEventListener(
			"wheel",
			function(evt) {
				if (Math.round(evt.timeStamp - _this.previousWheeling) > 10) {
					if (evt.deltaY < 0) {
						// scroll up
						_this.camera.weapons.nextWeapon(1);
					} else {
						// scroll down
						_this.camera.weapons.nextWeapon(-1);
					}

					_this.previousWheeling = evt.timeStamp;
				}
			},
			false
		);

		// Evenement pour changer le paramètre de rotation
		var pointerlockchange = function(event) {
			_this.controlEnabled =
				document.mozPointerLockElement === canvas ||
				document.webkitPointerLockElement === canvas ||
				document.msPointerLockElement === canvas ||
				document.pointerLockElement === canvas;
			if (!_this.controlEnabled) {
				_this.rotEngaged = false;
			} else {
				_this.rotEngaged = true;
			}
		};

		// Event pour changer l'état du pointeur, sous tout les types de navigateur
		document.addEventListener(
			"pointerlockchange",
			pointerlockchange,
			false
		);
		document.addEventListener(
			"mspointerlockchange",
			pointerlockchange,
			false
		);
		document.addEventListener(
			"mozpointerlockchange",
			pointerlockchange,
			false
		);
		document.addEventListener(
			"webkitpointerlockchange",
			pointerlockchange,
			false
		);
	},
	_checkMove: function(ratioFps) {
		// On bouge le player en lui attribuant la caméra
		this._checkUniqueMove(ratioFps, this.camera);
		for (var i = 0; i < this.ghostPlayers.length; i++) {
			// On bouge chaque ghost présent dans ghostPlayers
			this._checkUniqueMove(ratioFps, this.ghostPlayers[i]);
		}
	},
	_checkUniqueMove: function(ratioFps, player) {
		var relativeSpeed = this.speed / ratioFps;
		var playerSelected = player;

		if (playerSelected.axisMovement) {
			if (playerSelected.head) {
				var rotationPoint = playerSelected.head.rotation;
			} else {
				var rotationPoint = playerSelected.playerBox.rotation;
			}

			if (playerSelected.axisMovement[0]) {
				forward = new BABYLON.Vector3(
					parseFloat(Math.sin(parseFloat(rotationPoint.y))) *
						relativeSpeed,
					0,
					parseFloat(Math.cos(parseFloat(rotationPoint.y))) *
						relativeSpeed
				);
				playerSelected.playerBox.moveWithCollisions(forward);
			}
			if (playerSelected.axisMovement[1]) {
				backward = new BABYLON.Vector3(
					parseFloat(Math.sin(parseFloat(rotationPoint.y))) *
						relativeSpeed,
					0,
					parseFloat(Math.cos(parseFloat(rotationPoint.y))) *
						relativeSpeed
				);
				playerSelected.playerBox.moveWithCollisions(backward.negate());
			}
			if (playerSelected.axisMovement[2]) {
				left = new BABYLON.Vector3(
					parseFloat(
						Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))
					) * relativeSpeed,
					0,
					parseFloat(
						Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))
					) * relativeSpeed
				);
				playerSelected.playerBox.moveWithCollisions(left);
			}
			if (playerSelected.axisMovement[3]) {
				right = new BABYLON.Vector3(
					parseFloat(
						Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))
					) * relativeSpeed,
					0,
					parseFloat(
						Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))
					) * relativeSpeed
				);
				playerSelected.playerBox.moveWithCollisions(right.negate());
			}
		}

		playerSelected.playerBox.moveWithCollisions(
			new BABYLON.Vector3(0, -1.5 * relativeSpeed, 0)
		);
	},
	handleUserMouseDown: function() {
		if (this.isAlive === true) {
			this.camera.weapons.fire();
		}
	},
	handleUserMouseUp: function() {
		if (this.isAlive === true) {
			this.camera.weapons.stopFire();
		}
	},
	getDamage: function(damage, whoDamage) {
		var damageTaken = damage;
		// Tampon des dégâts par l'armure
		if (this.camera.armor > Math.round(damageTaken / 2)) {
			this.camera.armor -= Math.round(damageTaken / 2);
			damageTaken = Math.round(damageTaken / 2);
		} else {
			damageTaken = damageTaken - this.camera.armor;
			this.camera.armor = 0;
		}
		// Prise des dégâts avec le tampon de l'armure
		if (this.camera.health > damageTaken) {
			this.camera.health -= damageTaken;
		} else {
			// Envoi de la mort par le joueur
			this.playerDead(whoDamage);
		}
	},
	playerDead: function(whoKilled) {
		// Fonction appelée pour annoncer la destruction du joueur
		sendPostMortem(whoKilled);

		this.deadCamera = new BABYLON.ArcRotateCamera(
			"ArcRotateCamera",
			1,
			0.8,
			10,
			new BABYLON.Vector3(
				this.camera.playerBox.position.x,
				this.camera.playerBox.position.y,
				this.camera.playerBox.position.z
			),
			this.game.scene
		);

		this.game.scene.activeCamera = this.deadCamera;
		this.deadCamera.attachControl(
			this.game.scene.getEngine().getRenderingCanvas()
		);

		this.camera.playerBox.dispose();

		for (var i = 0; i < this.camera.weapons.inventory.length; i++) {
			this.camera.weapons.inventory[i].dispose();
		}

		this.camera.weapons.inventory = [];

		this.camera.dispose();
		this.isAlive = false;

		var newPlayer = this;
		var canvas = this.game.scene.getEngine().getRenderingCanvas();
		setTimeout(function() {
			newPlayer._initCamera(newPlayer.game.scene, canvas);
			newPlayer.launchRessurection();
		}, 4000);
	},
	launchRessurection: function() {
		ressurectMe();
	},
	sendNewData: function(data) {
		updateGhost(data);
	},
	sendActualData: function() {
		return {
			actualTypeWeapon: this.camera.weapons.actualWeapon,
			armor: this.camera.armor,
			life: this.camera.health,
			position: this.camera.playerBox.position,
			rotation: this.camera.playerBox.rotation,
			axisMovement: this.camera.axisMovement
		};
	},
	updateLocalGhost: function(data) {
		ghostPlayers = this.ghostPlayers;

		for (var i = 0; i < ghostPlayers.length; i++) {
			if (ghostPlayers[i].idRoom === data.id) {
				var boxModified = ghostPlayers[i].playerBox;
				// On applique un correctif sur Y, qui semble être au mauvais endroit
				if (data.position) {
					boxModified.position = new BABYLON.Vector3(
						data.position.x,
						data.position.y - 2.76,
						data.position.z
					);
				}
				if (data.axisMovement) {
					ghostPlayers[i].axisMovement = data.axisMovement;
				}
				if (data.rotation) {
					ghostPlayers[i].head.rotation.y = data.rotation.y;
				}
				if (data.axisMovement) {
					ghostPlayers[i].axisMovement = data.axisMovement;
				}
			}
		}
	}
};
