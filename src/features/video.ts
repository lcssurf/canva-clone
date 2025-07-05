"use client"

import { VideoData } from "./editor/components/ai-sidebar";

export async function fetchVideoData(videoUrl: string): Promise<any> {
    try {
        const response = await fetch('https://api.downsub.com/download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DOWNSUB_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: videoUrl,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Video data fetched successfully:', data);
        
        let txtUrl: string | undefined;

        const findTxtUrl = (subs: any[] | undefined) => {
            if (!subs) return undefined;
            const sub = subs.find(
                (s) => s.language === "English (auto-generated)" || s.language === "English"
            );
            return sub?.formats?.find((f: any) => f.format === "txt")?.url;
        };
        let plainText: string | undefined;
        try {
            txtUrl = findTxtUrl(data.data.subtitles) || findTxtUrl(data.data.translatedSubtitles);

            
            if (txtUrl) {
            const txtRes = await fetch(txtUrl);
            if (txtRes.ok) {
                plainText = await txtRes.text();
                // console.log('Plain text subtitle:', plainText);
            }else{
                console.error('Failed to fetch plain text subtitle:', txtRes.statusText);
            }
            }
        } catch (err) {
            console.error('Error fetching plain text subtitle:', err);
        }

        data.transcription = plainText;

        // console.log('Raw video data:', data.transcription);
        
        const formattedData: VideoData = {
            transcript: data.transcription || "",
            url: data.data.url || videoUrl,
            title: data.data.title || "",
            thumbnail: data.data.thumbnail,
            duration: data.data.duration,
            metadata: {
                author: data.data.metadata.author || "",
                channelId: data.data.metadata.channelId || "",
                channelUrl: data.data.metadata.channelUrl || "",
                description: data.data.description || "",
                isLiveContent: data.data.metadata.isLiveContent ?? false,
                isFamilySafe: data.data.metadata.isFamilySafe ?? true,
            }
        };

        console.log('Formatted video data:', formattedData);
        
        return formattedData;
    } catch (error) {
        throw error;
    }
}

// Exemplo de uso:
// fetchVideoData('https://www.youtube.com/watch?v=example')
//   .then(data => console.log(data))
//   .catch(err => console.error(err));