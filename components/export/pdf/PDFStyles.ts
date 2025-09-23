import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  // Document and page styles
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },

  // Cover page styles
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },

  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },

  coverUrl: {
    fontSize: 14,
    color: '#2563eb',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },

  coverDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 40,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },

  headerDate: {
    fontSize: 10,
    color: '#666666',
  },

  // Section styles
  section: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    border: 1,
    borderColor: '#e5e7eb',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#d1d5db',
  },

  sectionContent: {
    flex: 1,
  },

  // Score and metrics styles
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    border: 1,
    borderColor: '#e5e7eb',
  },

  scoreItem: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
  },

  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },

  scoreLabel: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'uppercase',
  },

  // Status indicator styles
  statusGood: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: 6,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },

  statusWarning: {
    color: '#d97706',
    backgroundColor: '#fffbeb',
    padding: 6,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },

  statusError: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },

  listBullet: {
    width: 16,
    fontSize: 10,
    color: '#666666',
    marginRight: 8,
  },

  listText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Table styles
  table: {
    marginBottom: 16,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },

  tableHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    fontWeight: 'bold',
  },

  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    paddingHorizontal: 8,
  },

  tableCellHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 8,
  },

  // Recommendation styles
  recommendation: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderLeft: 4,
    borderLeftColor: '#2563eb',
    borderRadius: 4,
  },

  recommendationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },

  recommendationText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Critical issue styles
  criticalIssue: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderLeft: 4,
    borderLeftColor: '#dc2626',
    borderRadius: 4,
  },

  criticalIssueTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },

  criticalIssueText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666666',
    fontSize: 9,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },

  // Utility styles
  flexRow: {
    flexDirection: 'row',
  },

  flexColumn: {
    flexDirection: 'column',
  },

  textCenter: {
    textAlign: 'center',
  },

  textBold: {
    fontWeight: 'bold',
  },

  marginBottom: {
    marginBottom: 12,
  },

  spacer: {
    height: 20,
  },

  // Badge styles
  badge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
  },

  badgeSuccess: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },

  badgeWarning: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
  },

  badgeError: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
})