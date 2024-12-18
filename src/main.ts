import kaplay, { rect, Vec2 }  from "kaplay";

type EditorRectType = 'solid' | 'platform' | 'ladder';

type EditorRect = {
    x: number;
    y: number;
    width: number;
    height: number;
    type: EditorRectType;
}

type EditorResult = {
    rects: EditorRect[];
}

const EDITOR_VALUES_KEY = "EDITOR_VALUES";

const k = kaplay({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    debug: true
});

k.debug.inspect = false;

export async function main() {
    let result: EditorResult = {
        rects: [],
    }
    let firstPos: Vec2 | undefined = undefined;
    let rectTypeMode: EditorRectType = 'solid';

    const houseSprite = await k.loadSprite("house", "sprites/house.png");
    k.add([
        k.sprite("house")
    ]);

    function getTypeColor(rectType: EditorRectType) {
        switch (rectType) {
            case "platform":
                return k.GREEN;
            case "ladder":
                return k.YELLOW;
            default:
                return k.RED;
        }
    }

    function pixelMousePoint() {
        const mousePos = k.toWorld(k.mousePos());
        mousePos.x = Math.round(mousePos.x);
        mousePos.y = Math.round(mousePos.y);
        return mousePos;
    }
    
    k.camPos(houseSprite.width / 2, houseSprite.height / 2);
    let zoom = 1;

    function setZoom(value: number) {
        zoom = k.clamp(value, 0.1, 1000);
        k.camScale(zoom, zoom);
    }

    k.onKeyPress((key) => {
        if (key === "1") {
            rectTypeMode = "solid";
        }
        if (key === "2") {
            rectTypeMode = "platform";
        }
        if (key === "3") {
            rectTypeMode = "ladder";
        }

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
            const value = JSON.stringify(result);
            console.log("export", value);
            localStorage.setItem(EDITOR_VALUES_KEY, value);
        }
        if (key === "i") {
            const value = localStorage.getItem(EDITOR_VALUES_KEY);
            if (value) {
                result = JSON.parse(value) as EditorResult;
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
            result.rects.pop();
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
        const mouse = pixelMousePoint();
        if (firstPos !== undefined) {
            const x = firstPos.x;
            const y = firstPos.y;
            const width = mouse.x - firstPos.x + 1;
            const height = mouse.y - firstPos.y + 1;

            result.rects.push({
                x,
                y,
                width,
                height,
                type: rectTypeMode
            })
            firstPos = undefined;
        } else {
            firstPos = mouse;
        }
    });

    k.onDraw(() => {
        const mouse = pixelMousePoint();

        k.drawRect({
            pos: mouse,
            width: 1,
            height: 1,
            color: getTypeColor(rectTypeMode)
        });

        k.drawText({
            text: rectTypeMode,
            pos: k.vec2(0, k.height()),
            anchor: "botleft",
            fixed: true,
            size: 32,
        })

        if (firstPos) {
            k.drawRect({
                pos: firstPos,
                width: 1,
                height: 1,
                color: getTypeColor(rectTypeMode)
            });

            // preview
            const width = mouse.x - firstPos.x + 1;
            const height = mouse.y - firstPos.y + 1;
            k.drawRect({
                pos: firstPos,
                width,
                height,
                color: getTypeColor(rectTypeMode),
                opacity: .25
            });
        }
        
        for (let i = 0; i < result.rects.length; i++) {
            const { x, y, width, height, type } = result.rects[i];
            k.drawRect({
                pos: k.vec2(x, y),
                width,
                height,
                color: getTypeColor(type),
                opacity: .5
            });
        }
    });
}

main();
