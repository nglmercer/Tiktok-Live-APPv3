export default {
    tiktokUsername: "sleepstreamxxx",
    // Enable for debugging errors.
    debug: true,

    enableFollow: true,
    followAction: {
        webhook: "http://localhost:8080/perro",
        args: "" // name=somename optional
    },

    enableLike: false,
    likeAction: {
        webhook: "http://localhost:8080/like",
        args: "" // name=somename optional
    },

    enableGifts: true,
    gifts: [
        {
            name: "Rose",
            webhook: "http://localhost:8080/zombie",
        },
        {
            name: "Weights",
            webhook: "http://localhost:8080/skeleton",
        },
        {
            name: "Football",
            webhook: "http://localhost:8080/araña",
        },
        {
            name: "Cotton's Shell",
            webhook: "http://localhost:8080/blaze",
        },
        {
            name: "Panda",
            webhook: "http://localhost:8080/creeper",
        },
        {
            name: "Mic",
            webhook: "http://localhost:8080/diamond",
        },
        {
            name: "Finger Heart",
            webhook: "http://localhost:8080/manzana",
        },
        {
            name: "Perfume",
            webhook: "http://localhost:8080/tnt",
        },
        {
            name: "Hand Wave",
            webhook: "http://localhost:8080/perla",
        },
        {
            name: "Gamepad",
            webhook: "http://localhost:8080/rayo",
        },
        {
            name: "Lollipop",
            webhook: "http://localhost:8080/armadura",
        },
        {
            name: "Cap",
            webhook: "http://localhost:8080/ravager",
        },
        {
            name: "Holiday Stocking",
            webhook: "http://localhost:8080/ghast",
        },
        {
            name: "Confetti",
            webhook: "http://localhost:8080/dragon",
        },
        {
            name: "Taco",
            webhook: "http://localhost:8080/bruja",
        },
        {
            name: "Money Gun",
            webhook: "http://localhost:8080/wither",
        },
        {
            name: "GG",
            webhook: "http://localhost:8080/enderman",
        },
        {
            name: "Cat Paws",
            webhook: "http://localhost:8080/gato",
        },
        {
            name: "Ice Cream Cone",
            webhook: "http://localhost:8080/slime",
        },
        {
            name: "Ice Cream Cone",
            webhook: "http://localhost:8080/notch",
        },

        


         // follow this pattern to add more gifts
    ]
}