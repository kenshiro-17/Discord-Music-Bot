import {
  isYouTubeUrl,
  isYouTubePlaylistUrl,
  isSpotifyUrl,
  parseSpotifyUrl,
  isSafeUrl,
  sanitizeSearchQuery,
} from '../../src/utils/validators';

describe('validators', () => {
  describe('isYouTubeUrl', () => {
    it('should validate YouTube video URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isYouTubeUrl('https://google.com')).toBe(false);
      expect(isYouTubeUrl('not a url')).toBe(false);
      expect(isYouTubeUrl('')).toBe(false);
    });
  });

  describe('isYouTubePlaylistUrl', () => {
    it('should validate YouTube playlist URLs', () => {
      expect(isYouTubePlaylistUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true);
      expect(isYouTubePlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true);
    });

    it('should reject non-playlist URLs', () => {
      expect(isYouTubePlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
      expect(isYouTubePlaylistUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(false);
    });
  });

  describe('isSpotifyUrl', () => {
    it('should validate Spotify URLs', () => {
      expect(isSpotifyUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh')).toBe(true);
      expect(isSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe(true);
      expect(isSpotifyUrl('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isSpotifyUrl('https://youtube.com')).toBe(false);
      expect(isSpotifyUrl('not a url')).toBe(false);
    });
  });

  describe('parseSpotifyUrl', () => {
    it('should parse track URLs', () => {
      const result = parseSpotifyUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh');
      expect(result).toEqual({
        type: 'track',
        id: '4iV5W9uYEdYUVa79Axb7Rh',
      });
    });

    it('should parse playlist URLs', () => {
      const result = parseSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
      expect(result).toEqual({
        type: 'playlist',
        id: '37i9dQZF1DXcBWIGoYBM5M',
      });
    });

    it('should parse album URLs', () => {
      const result = parseSpotifyUrl('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy');
      expect(result).toEqual({
        type: 'album',
        id: '4aawyAB9vmqN3uQ7FjRGTy',
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseSpotifyUrl('https://youtube.com')).toBeNull();
      expect(parseSpotifyUrl('not a url')).toBeNull();
    });
  });

  describe('isSafeUrl', () => {
    it('should allow HTTP and HTTPS URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('should reject unsafe protocols', () => {
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('ftp://example.com')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isSafeUrl('not a url')).toBe(false);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeSearchQuery('hello <script>world</script>')).toBe('hello scriptworld/script');
    });

    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  hello world  ')).toBe('hello world');
    });

    it('should limit length to 200 characters', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeSearchQuery(longString).length).toBe(200);
    });

    it('should handle normal queries', () => {
      expect(sanitizeSearchQuery('never gonna give you up')).toBe('never gonna give you up');
    });
  });
});
