let lastScrollX = window.scrollX || window.pageXOffset;
let lastScrollY = window.scrollY || window.pageYOffset;

let internalX = lastScrollX;
let internalY = lastScrollY;

function willOverlap(htbx, wall, targetX, targetY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();

    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    const wallAbsLeft = wallRect.left + currentScrollX;
    const wallAbsTop = wallRect.top + currentScrollY;
    
    const wallPredictLeft = wallAbsLeft - targetX;
    const wallPredictTop = wallAbsTop - targetY;
    const wallPredictRight = wallPredictLeft + wallRect.width;
    const wallPredictBottom = wallPredictTop + wallRect.height; 

    return !(
        htbxRect.top >= wallPredictBottom || // wall is completely below htbx
        htbxRect.right <= wallPredictLeft || // wall is completely to the left of htbx
        htbxRect.bottom <= wallPredictTop || // wall is completely above htbx
        htbxRect.left >= wallPredictRight    // wall is completely to the right of htbx 
    );
}

function getMinimumTranslationVector(htbx, wall, targetX, targetY) {
    const wallRect = wall.getBoundingClientRect();
    const htbxRect = htbx.getBoundingClientRect();

    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;

    const wallAbsLeft = wallRect.left + currentScrollX;
    const wallAbsTop = wallRect.top + currentScrollY;
    
    const wallPredictLeft = wallAbsLeft - targetX;
    const wallPredictTop = wallAbsTop - targetY;
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

function handleOverlap() {
    //need to make it win over scrollbar and middleclick

    const currentScrollX = window.scrollX || window.pageXOffset;
    const currentScrollY = window.scrollY || window.pageYOffset;
    
    const scrollDeltaX = currentScrollX - lastScrollX;
    const scrollDeltaY = currentScrollY - lastScrollY;

    lastScrollX = currentScrollX;
    lastScrollY = currentScrollY;
    //console.log("d: "+scrollDeltaX.toString()+", "+scrollDeltaY.toString()) // see scroll delta

    if(scrollDeltaX !== 0 || scrollDeltaY !== 0) {

        const scrollHitbox = document.querySelector('.scrollHitbox');
        const testWall = document.getElementById('testWall');

        if(scrollHitbox && testWall) {
            internalX += scrollDeltaX;
            internalY += scrollDeltaY;
            //console.log("internal: "+internalX.toString()+", "+internalY.toString()) // see internal position

            // substepped collision checksssss

            const distance = Math.hypot(scrollDeltaX, scrollDeltaY);

            const step = 6;
            const steps = Math.ceil(distance / step);

            const stepX = scrollDeltaX / steps;
            const stepY = scrollDeltaY / steps;

            let predictX = internalX - scrollDeltaX;
            let predictY = internalY - scrollDeltaY;
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

            if (currentScrollX !== Math.round(internalX) || currentScrollY !== Math.round(internalY)) {
                window.scrollTo(internalX, internalY);
                lastScrollX = window.scrollX || window.pageXOffset;
                lastScrollY = window.scrollY || window.pageYOffset;
            }
        }
    }
}

let walls = document.querySelectorAll('.wall');



function init() {
    walls = document.querySelectorAll('.wall');

    document.querySelector('.worldCenter').scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    lastScrollX = window.scrollX || window.pageXOffset;
    lastScrollY = window.scrollY || window.pageYOffset;
    internalX = lastScrollX;
    internalY = lastScrollY;
}

function update() {
    handleOverlap()
    
    window.requestAnimationFrame(update);
}

window.addEventListener('DOMContentLoaded', () => {
    init();
    window.requestAnimationFrame(update);
});