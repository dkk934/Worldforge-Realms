export function addMovementControls(object, speed = 0.1) {
    const keysPressed = {};

    // Track which keys are pressed
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });

    // Call this in your animation loop
    function updateMovement() {
        if (keysPressed['w'] || keysPressed['arrowup']) {
            object.position.z -= speed;
        }
        if (keysPressed['s'] || keysPressed['arrowdown']) {
            object.position.z += speed;
        }
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            object.position.x -= speed;
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            object.position.x += speed;
        }
    }

    return updateMovement;
}
