Game = function(canvasId) {
	// Canvas et engine défini ici
	var canvas = document.getElementById(canvasId);
	var engine = new BABYLON.Engine(canvas, true);
	var _this = this;

	// On initie la scène avec une fonction associé à l'objet Game
	this.scene = this._initScene(engine);
	this.engine = engine;

	var spawnPositionY = 5,
		spawnPositionZ = 0;
	this.allSpawnPoints = [
		new BABYLON.Vector3(-20, spawnPositionY, spawnPositionZ),
		new BABYLON.Vector3(0, spawnPositionY, spawnPositionZ),
		new BABYLON.Vector3(20, spawnPositionY, spawnPositionZ),
		new BABYLON.Vector3(-40, spawnPositionY, spawnPositionZ)
	];

	var armory = new Armory(this);
	this.armory = armory;

	var _player = new Player(_this, canvas);
	var _arena = new Arena(_this);

	this._PlayerData = _player;

	this._rockets = [];
	this._explosionRadius = [];
	this._lasers = [];

	// Permet au jeu de tourner
	engine.runRenderLoop(function() {
		// Récuperer le ratio par les fps
		_this.fps = Math.round(1000 / engine.getDeltaTime());

		// Checker le mouvement du joueur en lui envoyant le ratio de déplacement
		_player._checkMove(_this.fps / 60);

		_this.renderWeapons();

		_this.renderRockets();
		_this.renderExplosionRadius();
		_this.renderLaser();

		_this.scene.render();

		if (true === _player.camera.weapons.launchBullets) {
			_player.camera.weapons.launchFire();
		}
	});

	// Ajuste la vue 3D si la fenetre est agrandi ou diminué
	window.addEventListener(
		"resize",
		function() {
			if (engine) {
				engine.resize();
			}
		},
		false
	);
};

Game.prototype = {
	// Prototype d'initialisation de la scène
	_initScene: function(engine) {
		var scene = new BABYLON.Scene(engine);
		scene.clearColor = new BABYLON.Color3(0, 0, 0);
		scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
		scene.collisionsEnabled = true;
		return scene;
	},
	renderRockets: function() {
		for (var i = 0; i < this._rockets.length; i++) {
			// On crée un rayon qui part de la base de la roquette vers l'avant
			var rayRocket = new BABYLON.Ray(
				this._rockets[i].position,
				this._rockets[i].direction
			);

			// On regarde quel est le premier objet qu'on touche
			var meshFound = this._rockets[i].getScene().pickWithRay(rayRocket);

			// Si la distance au premier objet touché est inférieure à 10, on détruit la roquette
			if (!meshFound || meshFound.distance < 10) {
				// On vérifie qu'on a bien touché quelque chose
				if (meshFound.pickedMesh && !meshFound.pickedMesh.isMain) {
					// On crée une sphere qui représentera la zone d'impact
					var explosionRadius = BABYLON.Mesh.CreateSphere(
						"sphere",
						5.0,
						20,
						this.scene
					);
					// On positionne la sphère là où il y a eu impact
					explosionRadius.position = meshFound.pickedPoint;
					// On fait en sorte que les explosions ne soient pas considérées pour le Ray de la roquette
					explosionRadius.isPickable = false;
					// On crée un petit material orange
					explosionRadius.material = new BABYLON.StandardMaterial(
						"textureExplosion",
						this.scene
					);
					explosionRadius.material.diffuseColor = new BABYLON.Color3(
						1,
						0.6,
						0
					);
					explosionRadius.material.specularColor = new BABYLON.Color3(
						0,
						0,
						0
					);
					explosionRadius.material.alpha = 0.8;

					explosionRadius.computeWorldMatrix(true);

					if (
						this._PlayerData.isAlive &&
						this._PlayerData.camera.playerBox &&
						explosionRadius.intersectsMesh(
							this._PlayerData.camera.playerBox
						)
					) {
						this._PlayerData.getDamage(30);
					}

					this._explosionRadius.push(explosionRadius);
				}

				this._rockets[i].dispose();
				this._rockets.splice(i, 1);
			} else {
				var relativeSpeed = 4 / (this.fps / 60);
				this._rockets[i].position.addInPlace(
					this._rockets[i].direction.scale(relativeSpeed)
				);
			}
		}
	},
	renderExplosionRadius: function() {
		if (this._explosionRadius.length > 0) {
			for (var i = 0; i < this._explosionRadius.length; i++) {
				this._explosionRadius[i].material.alpha -= 0.02;
				if (this._explosionRadius[i].material.alpha <= 0) {
					this._explosionRadius[i].dispose();
					this._explosionRadius.splice(i, 1);
				}
			}
		}
	},
	renderLaser: function() {
		if (this._lasers.length > 0) {
			for (var i = 0; i < this._lasers.length; i++) {
				this._lasers[i].edgesWidth -= 0.5;
				if (this._lasers[i].edgesWidth <= 0) {
					this._lasers[i].dispose();
					this._lasers.splice(i, 1);
				}
			}
		}
	},
	renderWeapons: function() {
		if (this._PlayerData && this._PlayerData.camera.weapons.inventory) {
			// On regarde toutes les armes dans inventory
			var inventoryWeapons = this._PlayerData.camera.weapons.inventory;

			for (var i = 0; i < inventoryWeapons.length; i++) {
				// Si l'arme est active et n'est pas à la position haute (topPositionY)
				if (
					inventoryWeapons[i].isActive &&
					inventoryWeapons[i].position.y <
						this._PlayerData.camera.weapons.topPositionY
				) {
					inventoryWeapons[i].position.y += 0.1;
				} else if (
					!inventoryWeapons[i].isActive &&
					inventoryWeapons[i].position.y !=
						this._PlayerData.camera.weapons.bottomPosition.y
				) {
					// Sinon, si l'arme est inactive et pas encore à la position basse
					inventoryWeapons[i].position.y -= 0.1;
				}
			}
		}
	}
};

// Page entièrement chargé, on lance le jeu
document.addEventListener(
	"DOMContentLoaded",
	function() {
		new Game("renderCanvas");
	},
	false
);

// ------------------------- TRANSFO DE DEGRES/RADIANS
function degToRad(deg) {
	return (Math.PI * deg) / 180;
}
// ----------------------------------------------------

// -------------------------- TRANSFO DE DEGRES/RADIANS
function radToDeg(rad) {
	// return (Math.PI*deg)/180
	return (rad * 180) / Math.PI;
}
// ----------------------------------------------------
