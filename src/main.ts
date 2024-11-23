import kaplay, { AreaComp, ColorComp, GameObj, OpacityComp, PosComp, RectComp, Vec2, width, ZComp } from "kaplay";

type EditorRect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

const EDITOR_VALUES_KEY = "EDITOR_VALUES";

const k = kaplay({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    debug: true
});

k.debug.inspect = false;

export async function main() {
    let rects: EditorRect[] = [];
    let firstPos: Vec2 | undefined = undefined;

    const houseSprite = await k.loadSprite("house", "sprites/house.png");
    k.add([
        k.sprite("house")
    ]);

    function pixelMousePoint() {
        const mousePos = k.toWorld(k.mousePos());
        mousePos.x = Math.round(mousePos.x);
        mousePos.y = Math.round(mousePos.y);
        return mousePos;
    }
    
    k.camPos(houseSprite.width / 2, houseSprite.height / 2);
    let zoom = 1;

    function exportObjects(rects: EditorRect[]): string {
        return JSON.stringify(rects)
    }

    function importObjects(value: string): EditorRect[] {
        return JSON.parse(value) as EditorRect[];
    }

    function setZoom(value: number) {
        zoom = k.clamp(value, 0.1, 1000);
        k.camScale(zoom, zoom);
    }

    k.onKeyPress((key) => {
        if (key === "0") {
            setZoom(1);
        }
        if (key === "=") {
            setZoom(zoom * 1.1);
        }
        if (key === "-") {
            setZoom(zoom * 0.9);
        }
        if (key === "o") {
            const value = exportObjects(rects);
            localStorage.setItem(EDITOR_VALUES_KEY, value);
        }
        if (key === "i") {
            const value = localStorage.getItem(EDITOR_VALUES_KEY);
            if (value) {
                rects = importObjects(value);
            }
        }

        if (key === "escape") {
            firstPos = undefined;
        }
        if (k.isKeyDown("shift") && key === "r") { // reset
            firstPos = undefined;
            k.destroyAll("rect");
        }
        if (k.isKeyDown("control") && key === "z") { // undo
            rects.pop();
        }

        const movementModifier = k.isKeyDown("shift") ? 10 : 1;
        if (key === "up") {
            k.camPos(k.camPos().add(k.Vec2.UP.scale(movementModifier)));
        }
        if (key === "down") {
            k.camPos(k.camPos().add(k.Vec2.DOWN.scale(movementModifier)));
        }
        if (key === "left") {
            k.camPos(k.camPos().add(k.Vec2.LEFT.scale(movementModifier)));
        }
        if (key === "right") {
            k.camPos(k.camPos().add(k.Vec2.RIGHT.scale(movementModifier)));
        }
    })

    k.onScroll((delta) => {
        setZoom(zoom + delta.y / 200 * -1);
    });

    k.onMouseMove((_pos, delta) => {
        if (k.isMouseDown("left")) {
            const invert = delta.scale(-1).scale(1/zoom);
            k.camPos(k.camPos().add(invert));
        }
    });

    k.onMousePress("right", () => {
        const mousePos = pixelMousePoint();
        if (firstPos !== undefined) {
            const width = mousePos.x - firstPos.x + 1;
            const height = mousePos.y - firstPos.y + 1;
            rects.push({
                x: firstPos.x,
                y: firstPos.y,
                width,
                height,
            })
            firstPos = undefined;
        } else {
            firstPos = mousePos;
        }
    });

    k.onDraw(() => {
        const mouse = pixelMousePoint();
        k.drawRect({
            pos: mouse,
            width: 1,
            height: 1,
            color: k.BLUE
        });

        if (firstPos) {
            k.drawRect({
                pos: firstPos,
                width: 1,
                height: 1,
                color: k.BLUE
            });

            // preview
            const width = mouse.x - firstPos.x + 1;
            const height = mouse.y - firstPos.y + 1;
            k.drawRect({
                pos: firstPos,
                width,
                height,
                color: k.RED,
                opacity: .25
            });
        }
        
        for (let i = 0; i < rects.length; i++) {
            const { x, y, width, height } = rects[i];
            k.drawRect({
                pos: k.vec2(x, y),
                width,
                height,
                color: k.RED,
                opacity: .5
            });
        }
    });
}

main();
