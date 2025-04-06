class Level2Scene extends Phaser.Scene {
    constructor() {
        super('Level2Scene');
    }

    preload() {
        this.load.tilemapTiledJSON('map', 'assets/level2_map.tmj');
        this.load.image('-textures', 'assets/-textures.jpg');

        this.load.image('player', 'assets/player.png');
        this.load.image('shadow', 'assets/shadow_enemy.png');
        this.load.image('candle', 'assets/candle.png');
        this.load.image('exit', 'assets/exit.png');
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('-textures');
        map.createLayer('圖塊層 1', tileset);

        this.player = this.physics.add.sprite(100, 100, 'player').setScale(0.2);
        this.shadow = this.physics.add.sprite(400, 400, 'shadow').setScale(0.2);

        this.candleCollected = false;

        // 蠟燭與出口點
        this.candle = this.physics.add.sprite(600, 150, 'candle').setScale(0.3);
        this.exit = this.physics.add.sprite(700, 500, 'exit').setScale(0.3);

        this.physics.add.overlap(this.player, this.candle, () => {
            if (!this.candleCollected) {
                this.candleCollected = true;
                this.candle.destroy();
            }
        });

        this.physics.add.overlap(this.player, this.exit, () => {
            if (this.candleCollected) {
                this.scene.start('LevelCompletedScene');
            }
        });

        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            toggleFlashlight: Phaser.Input.Keyboard.KeyCodes.F
        });

        this.flashlightRadius = 150;
        this.flashlightAngle = Phaser.Math.DegToRad(70);
        this.flashlightActive = false;
        this.flashlightCooldown = false;

        this.flashlightGfx = this.make.graphics({ x: 0, y: 0, add: false });
        this.flashlightImage = this.add.image(400, 300, 'vision');
        this.flashlightImage.setDepth(10);
        this.flashlightImage.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    update() {
        const speed = this.keys.shift.isDown ? 200 : 100;
        this.player.setVelocity(0);

        if (this.keys.left.isDown) this.player.setVelocityX(-speed);
        if (this.keys.right.isDown) this.player.setVelocityX(speed);
        if (this.keys.up.isDown) this.player.setVelocityY(-speed);
        if (this.keys.down.isDown) this.player.setVelocityY(speed);

        if (Phaser.Input.Keyboard.JustDown(this.keys.toggleFlashlight) && !this.flashlightCooldown) {
            this.flashlightActive = !this.flashlightActive;
            if (this.flashlightActive) {
                this.time.delayedCall(5000, () => {
                    this.flashlightActive = false;
                    this.flashlightCooldown = true;
                    this.time.delayedCall(1000, () => {
                        this.flashlightCooldown = false;
                    });
                });
            }
        }

        const dx = this.shadow.x - this.player.x;
        const dy = this.shadow.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        const inLight = this.flashlightActive && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shadow.x, this.shadow.y) < this.flashlightRadius;

        if (inLight) {
            this.shadow.setVelocity((dx / dist) * 80, (dy / dist) * 80);
        } else {
            const speed = this.flashlightActive ? 60 : 120;
            this.physics.moveToObject(this.shadow, this.player, speed);
        }

        this.flashlightGfx.clear();
        this.flashlightGfx.fillStyle(0x000000, 0.9);
        this.flashlightGfx.fillRect(0, 0, 800, 600);

        if (this.flashlightActive) {
            const pointer = this.input.activePointer;
            const angleToMouse = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
            const leftBound = angleToMouse - this.flashlightAngle / 2;
            const rightBound = angleToMouse + this.flashlightAngle / 2;
            const steps = 30;

            this.flashlightGfx.fillStyle(0xffffff, 1);
            this.flashlightGfx.beginPath();
            this.flashlightGfx.moveTo(this.player.x, this.player.y);
            for (let i = 0; i <= steps; i++) {
                const angle = leftBound + (i / steps) * (rightBound - leftBound);
                const x = this.player.x + this.flashlightRadius * Math.cos(angle);
                const y = this.player.y + this.flashlightRadius * Math.sin(angle);
                this.flashlightGfx.lineTo(x, y);
            }
            this.flashlightGfx.closePath();
            this.flashlightGfx.fillPath();
        }

        this.flashlightGfx.generateTexture('vision', 800, 600);
        this.flashlightImage.setTexture('vision');

        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shadow.x, this.shadow.y) < 30) {
            this.scene.restart();
        }
    }
}

const LevelCompletedScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function LevelCompletedScene() {
        Phaser.Scene.call(this, { key: 'LevelCompletedScene' });
    },
    create: function () {
        this.add.text(200, 250, '你成功逃出這一層了！', { fontSize: '32px', fill: '#ffffff' });
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Level2Scene');
        });
    }
});

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
        },
    },
    scene: [Level2Scene, LevelCompletedScene],
};

new Phaser.Game(config);
