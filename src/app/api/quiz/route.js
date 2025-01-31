export async function GET() {
    try {
        const response = await fetch('https://api.jsonserve.com/Uw5CrX');
        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch quiz data' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
