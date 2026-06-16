import sys
import json
import collections
import spacy

def analyze_text(text):
    if not text.strip():
        return {
            "sentenceCount": 0,
            "wordCount": 0,
            "uniqueWordCount": 0,
            "passiveVoiceCount": 0,
            "subordinateClausesCount": 0,
            "avgSentenceLength": 0,
            "repeatedWords": []
        }

    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        # Fallback if model load fails (though it shouldn't as we just installed it)
        return {
            "error": f"Failed to load spaCy model: {str(e)}"
        }

    doc = nlp(text)

    # 1. Sentences
    sentences = list(doc.sents)
    sentence_count = len(sentences)

    # 2. Words & Tokens (filtering punctuation & spaces)
    words = [t for t in doc if not t.is_punct and not t.is_space]
    word_count = len(words)
    
    unique_words = set(t.text.lower() for t in words)
    unique_word_count = len(unique_words)

    # 3. Passive Voice Detection
    # In spaCy, passive constructions feature an auxiliary passive dependency relation ("auxpass")
    passive_voice_count = sum(1 for token in doc if token.dep_ == "auxpass")

    # 4. Subordinate Clauses
    # Dependency relations like "advcl" (adverbial clause), "acl" (adjectival/relative clause), 
    # and "ccomp" (clausal complement) represent subordinate structures.
    subordinate_clauses_count = sum(1 for token in doc if token.dep_ in ["advcl", "acl", "ccomp"])

    # 5. Average Sentence Length
    avg_sentence_length = round(word_count / sentence_count, 1) if sentence_count > 0 else 0

    # 6. Repeated Words Detection (excluding functional stop words, but allowing overused descriptors like 'very')
    allowed_stops = {"very", "really", "so", "good", "great", "many", "much", "more", "most", "always", "never", "often", "sometimes"}
    content_words = [
        t.text.lower() for t in words 
        if (not t.is_stop or t.text.lower() in allowed_stops) 
        and t.pos_ in ["NOUN", "PROPN", "VERB", "ADJ", "ADV"] 
        and len(t.text) >= 3 
        and not t.like_num
    ]
    
    word_freqs = collections.Counter(content_words)
    repeated_words = []
    
    for word, count in word_freqs.items():
        # A content word is flagged as over-repeated if it appears >= 4 times 
        # AND represents at least 1.5% of total words in the text.
        percentage = (count / word_count) * 100 if word_count > 0 else 0
        if count >= 4 and percentage >= 1.5:
            repeated_words.append({
                "word": word,
                "count": count
            })
            
    # Sort repeated words by count descending
    repeated_words.sort(key=lambda x: x["count"], reverse=True)

    return {
        "sentenceCount": sentence_count,
        "wordCount": word_count,
        "uniqueWordCount": unique_word_count,
        "passiveVoiceCount": passive_voice_count,
        "subordinateClausesCount": subordinate_clauses_count,
        "avgSentenceLength": avg_sentence_length,
        "repeatedWords": repeated_words
    }

if __name__ == "__main__":
    try:
        # Read from stdin
        input_text = sys.stdin.read()
        analysis = analyze_text(input_text)
        print(json.dumps(analysis))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
