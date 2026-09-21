

function scrollTest()
{
    window.scrollBy(10, 10);
}

function scrollCenterTest(){
    window.scrollTo(
     2000, 2000
 );
}

function doElementsOverlap(el1, el2) {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();

  return !(
    rect1.top > rect2.bottom || // el1 is completely below el2
    rect1.right < rect2.left || // el1 is completely to the left of el2
    rect1.bottom < rect2.top || // el1 is completely above el2
    rect1.left > rect2.right    // el1 is completely to the right of el2
  );
}

function checkOverlap() {
    const scrollHitbox = document.querySelector('.scrollHitbox');
    const testWall = document.getElementById('testWall');
    const mtv = getMinimumTranslationVector(scrollHitbox, testWall);

    if(mtv.x != 0 || mtv.y != 0) {
        console.log("Overlap detected! Minimum translation vector: x=" + mtv.x + ", y=" + mtv.y);
        window.scrollBy(mtv.x, mtv.y);
    }

    window.requestAnimationFrame(checkOverlap);
}

function getMinimumTranslationVector(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    const overlapX = getProjOverlap(rect1.left, rect1.right, rect2.left, rect2.right);
    const overlapY = getProjOverlap(rect1.bottom, rect1.top, rect2.bottom, rect2.top);
    
    const center1 = { x: (rect1.left + rect1.right) / 2, y: (rect1.top + rect1.bottom) / 2 };
    const center2 = { x: (rect2.left + rect2.right) / 2, y: (rect2.top + rect2.bottom) / 2 };
    if(overlapX > overlapY) {
        return {
            x: 0,
            y: center1.y < center2.y ? -overlapY : overlapY
        };
    }
    else{
        return {
            x: center1.x < center2.x ? -overlapX : overlapX,
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

window.requestAnimationFrame(checkOverlap);