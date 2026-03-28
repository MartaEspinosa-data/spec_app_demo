import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Review {
    name: string;
    lessons: string;
    text: string;
    rating: number;
}

const reviews: Review[] = [
    {
        name: "Shane",
        lessons: "22 Spanish lessons",
        rating: 5,
        text: "Marta is a great teacher that I would definitely recommend. Her classes have a good mix of informal conversation practice and formal learning, with good training materials and homework/revision also (if you want it). Small assignments between classes, such as watching a video on a certain topic in Spanish, help keep you engaged and provide a jumping-off point for the next lesson, without making you feel too burdened if you have a busy life."
    },
    {
        name: "Max0oD",
        lessons: "6 Spanish lessons",
        rating: 5,
        text: "I am very satisfied with my choice. Marta is a polite and professional teacher. Everything was well managed from the first minute. I had 6 classes with her and I am well prepared for my exam. for sure I will join her class again to improve my level in near future."
    },
    {
        name: "Eric Weeks",
        lessons: "107 Spanish lessons",
        rating: 5,
        text: "I have been working with Marta for several months now. She is terrific to work with; not only is she always upbeat and easy to talk with (she is very fluent in English also), but she has a seemingly limitless short and fun exercises to help teach you in specific areas where you may have a weakness. My ability to speak Spanish has gone from very halting and nervous when we first started to being much more comfortable and flowing with language. I can't recommend her highly enough!"
    },
    {
        name: "Jules",
        lessons: "19 Spanish lessons",
        rating: 5,
        text: "Marta is a great teacher, providing excellent in class and extra curricular materials to embed your learning. She is a very patient and thoughtful tutor. I would highly recommend Marta."
    }
];

export const ReviewsCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setIsExpanded(false);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        setIsExpanded(false);
    };

    const review = reviews[currentIndex];
    const isLong = review.text.length > 200;
    const displayText = isExpanded ? review.text : review.text.slice(0, 200) + (isLong ? "..." : "");

    return (
        <section className="max-w-4xl mx-auto mb-32 px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-4">What Students Say</h2>
                <div className="w-16 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
            </div>

            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-16 overflow-hidden">
                {/* Decorative Quote Mark */}
                <div className="absolute top-10 left-10 text-indigo-100 opacity-50 -z-0">
                    <Quote size={120} />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex gap-1 mb-6">
                        {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>

                    <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed mb-8 max-w-2xl transition-all duration-300">
                        "{displayText}"
                        {isLong && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="ml-2 text-indigo-600 font-bold hover:text-indigo-700 transition"
                            >
                                {isExpanded ? "Show Less" : "Read More"}
                            </button>
                        )}
                    </p>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg">
                            {review.name[0]}
                        </div>
                        <h4 className="text-xl font-black text-gray-900">{review.name}</h4>
                        <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{review.lessons}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8">
                    <button 
                        onClick={prev}
                        className="p-3 bg-white border border-gray-100 rounded-full shadow-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8">
                    <button 
                        onClick={next}
                        className="p-3 bg-white border border-gray-100 rounded-full shadow-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-12">
                    {reviews.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => { setCurrentIndex(i); setIsExpanded(false); }}
                            className={`h-2 rounded-full transition-all ${currentIndex === i ? 'w-8 bg-indigo-600 shadow-md shadow-indigo-200' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
