let htbxPos = {x: 0, y: 0};
let htbxPosNext = {x: 0, y: 0};

let suppressNextCollisionCheck = false;

function willOverlap(htbx, wall, nextX, nextY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();

    const htbxPredictLeft = nextX;
    const htbxPredictTop = nextY;
    const htbxPredictRight = htbxPredictLeft + htbxRect.width;
    const htbxPredictBottom = htbxPredictTop + htbxRect.height;

    const wallLeft = getPagePosition(wall).x;
    const wallTop = getPagePosition(wall).y;
    const wallRight = wallLeft + wallRect.width;
    const wallBottom = wallTop + wallRect.height; 

    return !(
        htbxPredictTop >= wallBottom || // wall is completely below htbx
        htbxPredictRight <= wallLeft || // wall is completely to the left of htbx
        htbxPredictBottom <= wallTop || // wall is completely above htbx
        htbxPredictLeft >= wallRight    // wall is completely to the right of htbx 
    );
}
function getMinimumTranslationVector(htbx, wall, nextX, nextY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();

    const htbxPredictLeft = nextX;
    const htbxPredictTop = nextY;
    const htbxPredictRight = htbxPredictLeft + htbxRect.width;
    const htbxPredictBottom = htbxPredictTop + htbxRect.height;

    const wallLeft = getPagePosition(wall).x;
    const wallTop = getPagePosition(wall).y;
    const wallRight = wallLeft + wallRect.width;
    const wallBottom = wallTop + wallRect.height; 

    const overlapX = getProjOverlap(htbxPredictLeft, htbxPredictRight, wallLeft, wallRight);
    const overlapY = getProjOverlap(htbxPredictBottom, htbxPredictTop, wallBottom, wallTop);

    const centerHtbx = { x: (htbxPredictLeft + htbxPredictRight) / 2, y: (htbxPredictTop + htbxPredictBottom) / 2 };
    const centerWall = { x: (wallLeft + wallRight) / 2, y: (wallTop + wallBottom) / 2 };
    if(overlapX > overlapY) {
        return {
            x: 0,
            y: centerHtbx.y < centerWall.y ? -overlapY : overlapY
        };
    }
    else{
        return {
            x: centerHtbx.x < centerWall.x ? -overlapX : overlapX,
            y: 0
        };
    }
}

function getProjOverlap(a0, a1, b0, b1)
{
    return Math.max(
        0, 
        Math.min(
            Math.max(a0, a1),
            Math.max(b0, b1)
        ) - 
        Math.max(
            Math.min(a0, a1),
            Math.min(b0, b1)
        )
    );
}

function moveToAndCollide(targetX, targetY) {
    // console.log("d: "+scrollDeltaX.toString()+", "+scrollDeltaY.toString()) // see scroll delta

    const scrollHitbox = document.getElementById('scrollHitbox');
    const deltaX = targetX - htbxPos.x;
    const deltaY = targetY - htbxPos.y;

    //console.log("internal: "+internalX.toString()+", "+internalY.toString()) // see internal position

    // substepped collision checksssss

    const distance = Math.hypot(deltaX, deltaY);

    const step = 1;
    const steps = Math.max(1, Math.ceil(distance / step));

    const stepX = deltaX / steps;
    const stepY = deltaY / steps;

    let predictX = htbxPos.x;
    let predictY = htbxPos.y;
    let breakLoop = false;
    let mtv = {x: 0, y: 0,};
    for(let i = 0; i < steps; i++) {
        predictX += stepX;
        predictY += stepY;

        for(const wall of walls) {
            if(willOverlap(scrollHitbox, wall, predictX, predictY)) {
                console.log("Overlap detected!");

                mtv = getMinimumTranslationVector(scrollHitbox, wall, predictX, predictY);

                predictX += mtv.x;
                predictY += mtv.y;
                
                breakLoop = true;
            }
        }
        if(breakLoop){
            break;
        }
    }

    
    htbxPos.x = predictX;
    htbxPos.y = predictY;
    if(targetX !== predictX || targetY !== predictY){
        scrollBy(predictX - targetX, predictY - targetY);
    }
}
function moveByAndCollide(dx, dy) {
    moveToAndCollide(htbxPos.x + dx, htbxPos.y + dy);
}

function hardScrollTo(x, y) {
    window.scrollTo({
        left: x,
        top: y,
        behavior: "instant"
    });
    
    suppressNextCollisionCheck = true;
}
function hardScrollBy(x,y) {
    window.scrollBy({
        left: x,
        top: y,
        behavior: "instant"
    });

    suppressNextCollisionCheck = true;
}
function hardScrollIntoView(element, args) {
    element.scrollIntoView(args);

    suppressNextCollisionCheck = true;
}

let walls = document.querySelectorAll('.wall');

function goHome() {
    hardScrollIntoView(document.getElementById('worldCenter'), {behavior: "instant", block: "center", inline: "center"});
}

function getPagePosition(element){
    return {
        x: element.getBoundingClientRect().left + globalThis.scrollX,
        y: element.getBoundingClientRect().top + globalThis.scrollY,
    };
}

function setPagePosition(element, x, y){
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    // element.style.top = y + "px";
    // element.style.left = x + "px";
    
}














window.addEventListener('DOMContentLoaded', () => {
    init();
    window.requestAnimationFrame(update);
});

let lastMousePos = {x: 0, y: 0};
window.addEventListener('mousemove', (e) => {
    let mousePos = {x: e.pageX, y: e.pageY,};
    const scrollHitbox = document.getElementById("scrollHitbox");
    const halfWidth = scrollHitbox.getBoundingClientRect().width / 2;
    const halfHeight = scrollHitbox.getBoundingClientRect().height / 2;

    setPagePosition(document.getElementById("mouseLabel"), mousePos.x,mousePos.y);

    if(suppressNextCollisionCheck) {
        htbxPos.x = mousePos.x - halfWidth;
        htbxPos.y = mousePos.y - halfHeight;
        suppressNextCollisionCheck = false;
    }
    else {
        moveToAndCollide(mousePos.x - halfWidth, mousePos.y - halfHeight);
    }

    const mouselabel = document.getElementById("mouseLabel");
    mouselabel.innerText = "mouse pos: " + mousePos.x.toString() + ", " + mousePos.y.toString();// + "\nmy pos: " + getPagePosition(mouselabel).x + ", " + getPagePosition(mouselabel).y;
});

let lastScroll = {x: 0, y:0};
window.addEventListener('scroll', () => {
    const scrollD = {x: globalThis.scrollX - lastScroll.x, y: globalThis.scrollY - lastScroll.y};
    
    if(suppressNextCollisionCheck) {
        htbxPos.x += scrollD.x;
        htbxPos.y += scrollD.y;
        suppressNextCollisionCheck = false;
    } else {
        moveByAndCollide(scrollD.x, scrollD.y);
    }

    lastHudCenter = getPagePosition(document.getElementById("hudCenter"));
    lastScroll = {x: globalThis.scrollX, y: globalThis.scrollY};
});

let lastHudCenter = {x: 0, y: 0};
window.addEventListener('resize', () => {
    const hudCenter = getPagePosition(document.getElementById("hudCenter"));
    const hudCenterD = {x: hudCenter.x - lastHudCenter.x, y: hudCenter.y - lastHudCenter.y};
    scrollBy(-hudCenterD.x, -hudCenterD.y);
    lastHudCenter = hudCenter;
});














function init() {
    walls = document.querySelectorAll('.wall');
    const hitboxPos = getPagePosition(document.getElementById("scrollHitbox"));
    htbxPos.x = hitboxPos.x;
    htbxPos.y = hitboxPos.y;
    htbxPosNext.x = hitboxPos.x;
    htbxPosNext.y = hitboxPos.y;
    console.log("%chowdy :3", "background: black; font-family: monospace; color: white;")

    goHome();
}

function update() {
    setPagePosition(document.getElementById("scrollHitbox"), htbxPos.x, htbxPos.y);

    document.getElementById("hitboxPos").textContent = "hitbox pos: " + htbxPos.x + ", " + htbxPos.y;
    document.getElementById("position").textContent = "scroll: " + globalThis.scrollX + ", " + globalThis.scrollY;
    document.getElementById("hudCenterPos").textContent = "hudCenter: " + lastHudCenter.x + ", " + lastHudCenter.y;
    window.requestAnimationFrame(update);
}