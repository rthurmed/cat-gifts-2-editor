import kaplay, { AreaComp, ColorComp, GameObj, OpacityComp, PosComp, RectComp, Vec2, ZComp } from "kaplay";

type RectObject = GameObj<PosComp | RectComp | ColorComp | OpacityComp | AreaComp | ZComp>

const EDITOR_VALUES_KEY = "EDITOR_VALUES";

const k = kaplay({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    debug: true
});

k.debug.inspect = false;

export async function main() {
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

    const firstPoint = k.add([
        k.pos(0, 0),
        k.rect(1, 1),
        k.color(k.BLUE),
        k.opacity(0),
    ]);

    const mousePoint = k.add([
        k.pos(0, 0),
        k.rect(1, 1),
        k.color(k.BLUE)
    ]);

    const previewRect = k.add([
        k.pos(0, 0),
        k.rect(0, 0),
        k.color(k.RED),
        k.opacity(0),
    ])

    let objects: RectObject[] = [];
    let firstPos: Vec2 | undefined = undefined;

    // CAMERA MOVEMENT
    
    k.camPos(houseSprite.width / 2, houseSprite.height / 2);
    let zoom = 1;

    function makeRectObject(pos: Vec2, width: number, height: number): RectObject {
        return k.add([
            "rect",
            k.pos(pos),
            k.rect(width, height),
            k.area(),
            k.color(k.RED),
            k.opacity(.5),
            k.z(10)
        ]);
    }

    function exportObjects(objects: RectObject[]): string {
        const rects = objects.map(object => ({
            id: object.id,
            x: object.pos.x,
            y: object.pos.y,
            width: object.width,
            height: object.height
        }));
        return JSON.stringify(rects)
    }

    function importObjects(value: string): RectObject[] {
        const rects = JSON.parse(value) as {
            id: number;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
        const objects = [];
        k.destroyAll("rect");
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            // FIXME: verify if already added
            const object = makeRectObject(k.vec2(rect.x, rect.y), rect.width, rect.height);
            objects.push(object);
        }
        return objects;
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
            const value = exportObjects(objects);
            localStorage.setItem(EDITOR_VALUES_KEY, value);
        }
        if (key === "i") {
            const value = localStorage.getItem(EDITOR_VALUES_KEY);
            if (value) {
                objects = importObjects(value);
            }
        }

        if (key === "escape") {
            firstPos = undefined;
            firstPoint.opacity = 0;
            previewRect.opacity = 0;
        }
        if (k.isKeyDown("shift") && key === "r") { // reset
            firstPos = undefined;
            objects = [];
            k.destroyAll("rect");
        }
        if (k.isKeyDown("control") && key === "z") { // undo
            const object = objects[objects.length - 1];
            object.destroy();
            delete objects[objects.length - 1]
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
        const pixelMousePos = pixelMousePoint();
        mousePoint.pos = pixelMousePos;

        if (firstPos !== undefined) {
            previewRect.width = pixelMousePos.x - firstPos.x + 1;
            previewRect.height = pixelMousePos.y - firstPos.y + 1;
        }
        
        if (k.isMouseDown("left")) {
            const invert = delta.scale(-1).scale(1/zoom);
            k.camPos(k.camPos().add(invert));
        }
    });

    // OBJECT CREATION

    k.onMousePress("right", () => {
        const mousePos = pixelMousePoint();
        if (firstPos !== undefined) {
            const width = mousePos.x - firstPos.x + 1;
            const height = mousePos.y - firstPos.y + 1;
            const object = makeRectObject(firstPos, width, height);
            objects.push(object);
            firstPos = undefined;
            previewRect.opacity = 0;
            previewRect.width = 0;
            previewRect.height = 0;
            firstPoint.opacity = 0;
        } else {
            firstPos = mousePos;
            previewRect.pos = firstPos;
            previewRect.opacity = .25;
            firstPoint.opacity = 1;
        }
        firstPoint.pos = firstPos ||  k.vec2(-100, -100);
    });
}

main();
