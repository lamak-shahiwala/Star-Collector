var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

let platforms, stars, player, bombs;
let cursors;
let score = 0;
let scoreText;
let gameOver = false;
let restartText;
let leftDown = false;
let rightDown = false;
let jumpDown = false;

function preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });

    // Touch control button images
    this.load.image("left-button", "assets/left_button.png");
    this.load.image("right-button", "assets/right_button.png");
    this.load.image("space-button", "assets/jump.png");
}

function create() {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.physics.add.collider(player, platforms);

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(child => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.45));
    });

    this.physics.add.collider(stars, platforms);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    restartText = this.add.text(100, 280, '', { fontSize: '32px', fill: '#ff0000' });

    this.physics.add.overlap(player, stars, collectStar, null, this);

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    cursors = this.input.keyboard.createCursorKeys();

    // Always show on-screen touch buttons
    const scale = 0.8;

    this.leftButton = this.add.image(60, 540, 'left-button')
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1)
        .setScale(scale);

    this.rightButton = this.add.image(160, 540, 'right-button')
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1)
        .setScale(scale);

    this.jumpButton = this.add.image(740, 540, 'space-button')
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(1)
        .setScale(scale);

    this.leftButton.on('pointerdown', () => { leftDown = true; });
    this.leftButton.on('pointerup', () => { leftDown = false; });
    this.leftButton.on('pointerout', () => { leftDown = false; });

    this.rightButton.on('pointerdown', () => { rightDown = true; });
    this.rightButton.on('pointerup', () => { rightDown = false; });
    this.rightButton.on('pointerout', () => { rightDown = false; });

    this.jumpButton.on('pointerdown', () => { jumpDown = true; });
    this.jumpButton.on('pointerup', () => { jumpDown = false; });
    this.jumpButton.on('pointerout', () => { jumpDown = false; });
}

function update() {
    if (gameOver) {
        if (this.input.keyboard.checkDown(cursors.space, 250)) {
            this.scene.restart();
            gameOver = false;
            score = 0;
        }
        return;
    }

    let moveLeft = cursors.left.isDown || leftDown;
    let moveRight = cursors.right.isDown || rightDown;
    let jump = (cursors.space.isDown || cursors.up.isDown || jumpDown) && player.body.touching.down;

    if (moveLeft) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (moveRight) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (jump) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => {
            child.enableBody(true, child.x, 0, true, true);
        });

        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    restartText.setText('Game Over! Press SPACE to restart');
    gameOver = true;
}
