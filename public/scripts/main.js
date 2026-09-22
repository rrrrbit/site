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

function checkOverlap() {
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

            // substepped collision checksssss

            const distance = Math.hypot(scrollDeltaX, scrollDeltaY);

            const step = 4;
            const steps = Math.ceil(distance / step);

            const stepX = scrollDeltaX / steps;
            const stepY = scrollDeltaY / steps;

            let predictX = internalX - scrollDeltaX;
            let predictY = internalY - scrollDeltaY;

            for(let i = 0; i < steps; i++) {
                predictX += stepX;
                predictY += stepY;

                if(willOverlap(scrollHitbox, testWall)) {
                    console.log("Overlap detected!");

                    predictX -= stepX;
                    predictY -= stepY;

                    internalX = predictX;
                    internalY = predictY;
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
    window.requestAnimationFrame(checkOverlap);
}

window.addEventListener('DOMContentLoaded', () => {
    lastScrollX = window.scrollX || window.pageXOffset;
    lastScrollY = window.scrollY || window.pageYOffset;
    internalX = lastScrollX;
    internalY = lastScrollY;
    window.requestAnimationFrame(checkOverlap);
});