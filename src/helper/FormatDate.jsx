export default function formatDate(dateString) {
    const date = new Date(dateString);

    const options = {
        weekday: "long",
        month: "short",
        day: "2-digit",
        year: "numeric",
    };

    // Format: Sunday, Nov 09 2025
    const formattedDate = date.toLocaleDateString("en-US", options);

    // Format time in 12h format: 3:40 PM
    const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return `${ formattedDate } - ${ formattedTime }`;
}
