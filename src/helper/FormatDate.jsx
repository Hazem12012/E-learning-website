export default function formatDate(dateString) {
    const date = new Date(dateString);

    const options = {
        weekday: "long",
        month: "short",
        day: "2-digit",
        year: "numeric",
    };

    const formattedDate = date.toLocaleDateString("en-US", options);

    const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return `${ formattedDate } - ${ formattedTime }`;
}
