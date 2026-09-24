let lastHtbxPos = {x: 0, y: 0};
let htbxD = {x: 0, y: 0};
let internalX = lastHtbxPos.x;
let internalY = lastHtbxPos.y;

let suppressNextCollisionCheck = false;

function willOverlap(htbx, wall, nextX, nextY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();

    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    const wallAbsLeft = wallRect.left + currentScrollX;
    const wallAbsTop = wallRect.top + currentScrollY;
    
    const wallPredictLeft = wallAbsLeft - nextX;
    const wallPredictTop = wallAbsTop - nextY;
    const wallPredictRight = wallPredictLeft + wallRect.width;
    const wallPredictBottom = wallPredictTop + wallRect.height; 

    return !(
        htbxRect.top >= wallPredictBottom || // wall is completely below htbx
        htbxRect.right <= wallPredictLeft || // wall is completely to the left of htbx
        htbxRect.bottom <= wallPredictTop || // wall is completely above htbx
        htbxRect.left >= wallPredictRight    // wall is completely to the right of htbx 
    );
}

function getMinimumTranslationVector(htbx, wall, nextX, nextY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();
    
    const wallPredictLeft = getPagePosition(wall).x - nextX;
    const wallPredictTop = getPagePosition(wall).y - nextY;
    const wallPredictRight = wallPredictLeft + wallRect.width;
    const wallPredictBottom = wallPredictTop + wallRect.height; 

    const overlapX = getProjOverlap(htbxRect.left, htbxRect.right, wallPredictLeft, wallPredictRight);
    const overlapY = getProjOverlap(htbxRect.bottom, htbxRect.top, wallPredictBottom, wallPredictTop);

    const centerHtbx = { x: (htbxRect.left + htbxRect.right) / 2, y: (htbxRect.top + htbxRect.bottom) / 2 };
    const centerWall = { x: (wallPredictLeft + wallPredictRight) / 2, y: (wallPredictTop + wallPredictBottom) / 2 };
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

function handleOverlap(currentX, currentY, deltaX, deltaY) {
    // console.log("d: "+scrollDeltaX.toString()+", "+scrollDeltaY.toString()) // see scroll delta

    const scrollHitbox = document.getElementById('scrollHitbox');

    internalX += deltaX;
    internalY += deltaY;
    //console.log("internal: "+internalX.toString()+", "+internalY.toString()) // see internal position

    // substepped collision checksssss

    const distance = Math.hypot(deltaX, deltaY);

    const step = 2;
    const steps = Math.ceil(distance / step);

    const stepX = deltaX / steps;
    const stepY = deltaY / steps;

    let predictX = internalX - deltaX;
    let predictY = internalY - deltaY;
    let breakLoop = false;
    for(let i = 0; i < steps; i++) {
        predictX += stepX;
        predictY += stepY;

        for(const wall of walls) {
            if(willOverlap(scrollHitbox, wall, predictX, predictY)) {
                console.log("Overlap detected!");

                const mtv = getMinimumTranslationVector(scrollHitbox, wall, predictX, predictY);

                predictX += mtv.x;
                predictY += mtv.y;

                internalX = predictX;
                internalY = predictY;
                breakLoop = true;
            }
        }
        if(breakLoop){
            break;
        }
    }

    if (currentX !== Math.round(internalX) || currentY !== Math.round(internalY)) {
        hardScrollTo(internalX, internalY);
    }
}

function hardScrollTo(x, y) {
    window.scrollTo({
        left: x,
        top: y,
        behavior: "instant"
    });
    
    suppressNextCollisionCheck = true;
    lastHtbxPos = getPagePosition(document.getElementById("scrollHitbox"));
}
function hardScrollBy(x,y) {
    window.scrollBy({
        left: x,
        top: y,
        behavior: "instant"
    });

    suppressNextCollisionCheck = true;
    lastHtbxPos = getPagePosition(document.getElementById("scrollHitbox"));
    internalX = lastHtbxPos.x;
    internalY = lastHtbxPos.y;
}
function hardScrollIntoView(element, args) {
    element.scrollIntoView(args);

    suppressNextCollisionCheck = true;
    lastHtbxPos = getPagePosition(document.getElementById("scrollHitbox"));
    internalX = lastHtbxPos.x;
    internalY = lastHtbxPos.y;
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
    element.style.top = y + "px";
    element.style.left = x + "px";
}

function translatePagePosition(element, x, y){
    const prev = getPagePosition(element);
    setPagePosition(element, prev.x + x, prev.y + y);
}














window.addEventListener('DOMContentLoaded', () => {
    init();
    window.requestAnimationFrame(update);
});

let lastMousePos = {x: 0, y: 0};
window.addEventListener('mousemove', (e) => {
    let mousePos = {x: e.pageX, y: e.pageY,};
    let mouseD = {x: mousePos.x - lastMousePos.x, y: mousePos.y - lastMousePos.y};

    setPagePosition(document.getElementById("mouseLabel"), mousePos.x,mousePos.y);
    setPagePosition(document.getElementById("scrollHitbox"), mousePos.x, mousePos.y);
    document.getElementById("mouseLabel").innerText = mousePos.x.toString() + ", " + mousePos.y.toString();
});

let lastScroll = {x: 0, y:0};
window.addEventListener('scroll', (e) => {
    const scrollD = {x: globalThis.scrollX - lastScroll.x, y: globalThis.scrollY - lastScroll.y};
    translatePagePosition(document.getElementById("scrollHitbox"), scrollD.x + 8, scrollD.y + 8);

    lastScroll = {x: globalThis.scrollX, y: globalThis.scrollY};
});
window.addEventListener('resize', (e) => {

});














function init() {
    walls = document.querySelectorAll('.wall');
    console.log("%chowdy :3", "background: black; font-family: monospace; color: white;")

    //goHome();
    
}

function update() {
    const htbxPos = getPagePosition(document.getElementById("scrollHitbox"));
    htbxD = {x: htbxPos.x - lastHtbxPos.x, y: htbxPos.y - lastHtbxPos.y};

    if(htbxD.x !== 0 || htbxD.y !== 0){
        if(suppressNextCollisionCheck) {
            suppressNextCollisionCheck = false;
        } else {
            handleOverlap(htbxPos.x, htbxPos.y, htbxD.x, htbxD.y);
        }
    }

    console.log(internalX);
    lastHtbxPos = htbxPos;



    document.getElementById("position").textContent = globalThis.scrollX.toString() + ", " + globalThis.scrollY.toString();
    window.requestAnimationFrame(update);
}